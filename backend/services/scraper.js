const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Função de limpeza (Notícias com mais de 30 dias e URLs corrompidas)
async function cleanupOldOpportunities(prisma) {
  console.log('[Scraper] Iniciando limpeza de oportunidades com mais de 30 dias e links quebrados...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Remove registros antigos
    const result = await prisma.$executeRaw`
      DELETE FROM mural_oportunidades 
      WHERE published_date < ${thirtyDaysAgo}
    `;
    console.log(`[Scraper Cleanup] Removidas ${result} oportunidades obsoletas.`);

    // Remove registros com URLs relativas (quebradas) que começam com "/" ou não têm "http"
    const resultBroken = await prisma.$executeRaw`
      DELETE FROM mural_oportunidades 
      WHERE source_url NOT LIKE 'http%' OR source_url IS NULL
    `;
    console.log(`[Scraper Cleanup] Removidas ${resultBroken} oportunidades com URL quebrada.`);
  } catch (err) {
    console.error('[Scraper Cleanup Error]:', err);
  }
}

// Helper para salvar oportunidades no banco evitando duplicatas
async function saveOpportunities(prisma, opportunitiesList) {
  let insertedCount = 0;
  for (const opp of opportunitiesList) {
    try {
      // Truncar campos para evitar erros de limite de caracteres do banco (ex: VarChar(255) para título)
      const title = opp.title ? opp.title.substring(0, 250) : '';
      const description = opp.description || '';
      const category = opp.category ? opp.category.substring(0, 90) : '';
      const sourceName = opp.sourceName ? opp.sourceName.substring(0, 140) : '';
      const sourceUrl = opp.sourceUrl || null;
      const publishedDate = opp.publishedDate || new Date();

      // Verificar se a URL já existe no banco
      const existing = await prisma.$queryRaw`
        SELECT id FROM mural_oportunidades WHERE source_url = ${sourceUrl} LIMIT 1
      `;

      if (existing && existing.length > 0) {
        continue;
      }

      // Inserir nova oportunidade
      await prisma.$executeRaw`
        INSERT INTO mural_oportunidades (title, description, category, source_name, source_url, published_date)
        VALUES (${title}, ${description}, ${category}, ${sourceName}, ${sourceUrl}, ${publishedDate})
      `;
      insertedCount++;
    } catch (dbErr) {
      console.error('[Scraper DB Error] Erro ao salvar oportunidade:', dbErr);
    }
  }
  return insertedCount;
}

// 1. Scraping SINE/IDT Itapipoca
async function scrapeSINE(prisma) {
  console.log('[Scraper] Iniciando coleta do SINE/IDT...');
  const opportunitiesList = [];
  try {
    const url = 'https://www.idt.org.br/vagas-de-emprego';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('itapipoca') || text.toLowerCase().includes('vagas'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          try {
            fullUrl = new URL(href, 'https://www.idt.org.br').href;
          } catch (e) {
            if (href.startsWith('/')) {
              fullUrl = `https://www.idt.org.br${href}`;
            } else {
              fullUrl = `https://www.idt.org.br/${href}`;
            }
          }
        }

        opportunitiesList.push({
          title: text || 'Vagas de Emprego - SINE Itapipoca',
          description: `Vagas de emprego divulgadas pelo SINE/IDT. Acesse o portal para conferir todos os detalhes e orientações para Itapipoca.`,
          category: 'Empregos',
          sourceName: 'SINE Itapipoca / IDT',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Nenhum item encontrado no SINE. Verificar seletores HTML.');
      
      // Registro fallback
      opportunitiesList.push({
        title: 'Vagas de Emprego do SINE/IDT Itapipoca (Painel Oficial)',
        description: 'Confira as vagas de emprego ativas hoje na unidade do SINE/IDT de Itapipoca. Oportunidades para diversos setores como comércio, serviços e administrativo.',
        category: 'Empregos',
        sourceName: 'SINE Itapipoca / IDT',
        sourceUrl: 'https://www.idt.org.br/vagas-de-emprego',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] SINE/IDT: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar SINE/IDT: ${err.message}`);
    const fallback = [{
      title: 'Vagas de Emprego do SINE/IDT Itapipoca (Painel Oficial)',
      description: 'Confira as vagas de emprego ativas hoje na unidade do SINE/IDT de Itapipoca. Oportunidades para diversos setores como comércio, serviços e administrativo.',
      category: 'Empregos',
      sourceName: 'SINE Itapipoca / IDT',
      sourceUrl: 'https://www.idt.org.br/vagas-de-emprego',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 2. Scraping IFCE Itapipoca
async function scrapeIFCE(prisma) {
  console.log('[Scraper] Iniciando coleta do IFCE Itapipoca...');
  const opportunitiesList = [];
  try {
    const url = 'https://ifce.edu.br/itapipoca/noticias';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a.grid-item, .grid-item').each((i, el) => {
      const title = $(el).find('h3').text().trim();
      if (!title) return;

      const sub = $(el).find('p.subtitulo').text().trim();
      const hat = $(el).find('p.hat').text().trim();
      const description = sub || hat || 'Acesse a notícia completa no portal do IFCE Campus Itapipoca.';

      const href = $(el).attr('href');
      if (!href) return;

      let fullUrl = href;
      if (!href.startsWith('http://') && !href.startsWith('https://')) {
        fullUrl = href.startsWith('/') ? `https://ifce.edu.br${href}` : `https://ifce.edu.br/${href}`;
      }

      // Definir categoria com base no título/descrição
      const textToAnalyze = `${title} ${description} ${hat}`.toLowerCase();
      let category = 'Capacitação';
      if (
        textToAnalyze.includes('edital') ||
        textToAnalyze.includes('seleção') ||
        textToAnalyze.includes('processo seletivo') ||
        textToAnalyze.includes('concurso') ||
        textToAnalyze.includes('chamada') ||
        textToAnalyze.includes('vestibular')
      ) {
        category = 'Editais';
      }

      opportunitiesList.push({
        title,
        description,
        category,
        sourceName: 'IFCE Itapipoca',
        sourceUrl: fullUrl,
        publishedDate: new Date()
      });
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar IFCE Itapipoca: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Notícias e Editais Oficiais - IFCE Itapipoca',
        description: 'Fique por dentro dos cursos de extensão, processos seletivos para graduação/técnicos e editais abertos no IFCE Campus Itapipoca.',
        category: 'Editais',
        sourceName: 'IFCE Itapipoca',
        sourceUrl: 'https://ifce.edu.br/itapipoca/noticias',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] IFCE Itapipoca: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar IFCE Itapipoca: ${err.message}`);
    const fallback = [{
      title: 'Notícias e Editais Oficiais - IFCE Itapipoca',
      description: 'Fique por dentro dos cursos de extensão, processos seletivos para graduação/técnicos e editais abertos no IFCE Campus Itapipoca.',
      category: 'Editais',
      sourceName: 'IFCE Itapipoca',
      sourceUrl: 'https://ifce.edu.br/itapipoca/noticias',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 3. Scraping Prefeitura de Itapipoca
async function scrapePrefeitura(prisma) {
  console.log('[Scraper] Iniciando coleta do Prefeitura de Itapipoca...');
  const opportunitiesList = [];
  try {
    const url = 'https://itapipoca.ce.gov.br/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('h4.data_h4').each((i, el) => {
      const h4 = $(el);
      const a = h4.find('a.LinkInforma3');
      if (a.length === 0) return;

      const title = a.text().trim();
      const href = a.attr('href') || '';
      if (!title || !href) return;

      const parent = h4.parent();
      const p = parent.find('p').first();
      const description = p.text().trim() || 'Acesse a publicação oficial no portal da Prefeitura de Itapipoca.';

      // Obter tag (#edital, #saúde, etc)
      let tagText = '';
      parent.find('span').each((j, spanEl) => {
        const text = $(spanEl).text().trim();
        if (text.startsWith('#')) {
          tagText = text;
        }
      });

      // Obter data
      let dateText = '';
      parent.find('span').each((j, spanEl) => {
        const text = $(spanEl).text().trim();
        if (/\d{2}-\d{2}-\d{4}/.test(text)) {
          dateText = text;
        }
      });

      // Extrair ID numérico do link para evitar duplicar URL física / amigável
      const idMatch = href.match(/(?:\/informa\/|id=)(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      if (!id) return;

      const canonicalUrl = `https://itapipoca.ce.gov.br/informa.php?id=${id}`;

      // Tenta fazer o parse da data (ex: 26-11-2025)
      let publishedDate = new Date();
      if (dateText) {
        const match = dateText.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (match) {
          publishedDate = new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00Z`);
        }
      }

      // Definir categoria com base no título/descrição/tags
      const textToAnalyze = `${title} ${description} ${tagText}`.toLowerCase();
      let category = 'Notícias';
      if (
        textToAnalyze.includes('edital') ||
        textToAnalyze.includes('seleção') ||
        textToAnalyze.includes('processo seletivo') ||
        textToAnalyze.includes('concurso') ||
        textToAnalyze.includes('chamada') ||
        textToAnalyze.includes('licitação')
      ) {
        category = 'Editais';
      } else if (
        textToAnalyze.includes('curso') ||
        textToAnalyze.includes('capacitação') ||
        textToAnalyze.includes('formação') ||
        textToAnalyze.includes('educação') ||
        textToAnalyze.includes('ensino')
      ) {
        category = 'Capacitação';
      }

      // Evita duplicatas locais baseadas na URL canônica
      if (!opportunitiesList.some(o => o.sourceUrl === canonicalUrl)) {
        opportunitiesList.push({
          title,
          description,
          category,
          sourceName: 'Prefeitura de Itapipoca',
          sourceUrl: canonicalUrl,
          publishedDate
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar Prefeitura de Itapipoca: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Editais e Publicações Oficiais - Prefeitura de Itapipoca',
        description: 'Consulte os últimos editais públicos, comunicados oficiais e notícias de interesse geral no portal da Prefeitura Municipal de Itapipoca.',
        category: 'Editais',
        sourceName: 'Prefeitura de Itapipoca',
        sourceUrl: 'https://itapipoca.ce.gov.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] Prefeitura de Itapipoca: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar Prefeitura de Itapipoca: ${err.message}`);
    const fallback = [{
      title: 'Editais e Publicações Oficiais - Prefeitura de Itapipoca',
      description: 'Consulte os últimos editais públicos, comunicados oficiais e notícias de interesse geral no portal da Prefeitura Municipal de Itapipoca.',
      category: 'Editais',
      sourceName: 'Prefeitura de Itapipoca',
      sourceUrl: 'https://itapipoca.ce.gov.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 4. Scraping SENAI (CE)
async function scrapeSENAI(prisma) {
  console.log('[Scraper] Iniciando coleta do SENAI/CE...');
  const opportunitiesList = [];
  try {
    const url = 'https://www.senai-ce.org.br/noticias';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('curso') || text.toLowerCase().includes('inscrição') || text.toLowerCase().includes('gratuito') || text.toLowerCase().includes('vagas'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://www.senai-ce.org.br${href}` : `https://www.senai-ce.org.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Cursos e Qualificação Profissional - SENAI Ceará',
          description: `Curso profissionalizante/técnico divulgado pelo SENAI Ceará. Acesse o portal oficial para mais informações de inscrições e requisitos.`,
          category: 'Capacitação',
          sourceName: 'SENAI/CE',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar SENAI/CE: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Cursos Gratuitos e Qualificação Profissional - SENAI Ceará',
        description: 'Qualificação profissional gratuita e cursos técnicos presenciais e a distância oferecidos pelo SENAI Ceará. Confira os editais e vagas abertas no portal oficial.',
        category: 'Capacitação',
        sourceName: 'SENAI/CE',
        sourceUrl: 'https://www.senai-ce.org.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] SENAI/CE: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar SENAI/CE: ${err.message}`);
    const fallback = [{
      title: 'Cursos Gratuitos e Qualificação Profissional - SENAI Ceará',
      description: 'Qualificação profissional gratuita e cursos técnicos presenciais e a distância oferecidos pelo SENAI Ceará. Confira os editais e vagas abertas no portal oficial.',
      category: 'Capacitação',
      sourceName: 'SENAI/CE',
      sourceUrl: 'https://www.senai-ce.org.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 5. Scraping SESC (CE)
async function scrapeSESC(prisma) {
  console.log('[Scraper] Iniciando coleta do SESC/CE...');
  const opportunitiesList = [];
  try {
    const url = 'https://www.sesc-ce.com.br/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('curso') || text.toLowerCase().includes('cultura') || text.toLowerCase().includes('edital') || text.toLowerCase().includes('credenciamento'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://www.sesc-ce.com.br${href}` : `https://www.sesc-ce.com.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Cursos e Atividades - SESC Ceará',
          description: `Oportunidade de capacitação, cultura ou credenciamento oferecido pelo SESC Ceará. Confira detalhes completos e inscrições no site oficial.`,
          category: 'Capacitação',
          sourceName: 'SESC/CE',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar SESC/CE: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Cursos e Desenvolvimento Social - SESC Ceará',
        description: 'Confira a programação de cursos, atividades culturais, esportivas e de desenvolvimento social promovidas pelo SESC Ceará para comerciários e público geral.',
        category: 'Capacitação',
        sourceName: 'SESC/CE',
        sourceUrl: 'https://www.sesc-ce.com.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] SESC/CE: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar SESC/CE: ${err.message}`);
    const fallback = [{
      title: 'Cursos e Desenvolvimento Social - SESC Ceará',
      description: 'Confira a programação de cursos, atividades culturais, esportivas e de desenvolvimento social promovidas pelo SESC Ceará para comerciários e público geral.',
      category: 'Capacitação',
      sourceName: 'SESC/CE',
      sourceUrl: 'https://www.sesc-ce.com.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 6. Scraping SEBRAE
async function scrapeSEBRAE(prisma) {
  console.log('[Scraper] Iniciando coleta do SEBRAE...');
  const opportunitiesList = [];
  try {
    const url = 'https://ce.sebrae.com.br/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('curso') || text.toLowerCase().includes('mei') || text.toLowerCase().includes('evento') || text.toLowerCase().includes('capacita'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://ce.sebrae.com.br${href}` : `https://ce.sebrae.com.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Cursos e Gestão - SEBRAE Ceará',
          description: `Trilha de aprendizagem ou evento de empreendedorismo do SEBRAE. Ideal para MEI e donos de pequenos negócios melhorarem sua gestão.`,
          category: 'Empreendedorismo',
          sourceName: 'SEBRAE',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar SEBRAE: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Cursos e Capacitações para Empreendedores - SEBRAE Ceará',
        description: 'Acesse trilhas de aprendizagem, cursos gratuitos para MEI, orientações sobre gestão, finanças, marketing e eventos promovidos pelo SEBRAE Ceará.',
        category: 'Empreendedorismo',
        sourceName: 'SEBRAE',
        sourceUrl: 'https://ce.sebrae.com.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] SEBRAE: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar SEBRAE: ${err.message}`);
    const fallback = [{
      title: 'Cursos e Capacitações para Empreendedores - SEBRAE Ceará',
      description: 'Acesse trilhas de aprendizagem, cursos gratuitos para MEI, orientações sobre gestão, finanças, marketing e eventos promovidos pelo SEBRAE Ceará.',
      category: 'Empreendedorismo',
      sourceName: 'SEBRAE',
      sourceUrl: 'https://ce.sebrae.com.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 7. Scraping AVA MEC
async function scrapeAVAMEC(prisma) {
  console.log('[Scraper] Iniciando coleta do AVA MEC...');
  const opportunitiesList = [];
  try {
    const url = 'https://avamec.mec.gov.br/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('curso') || text.toLowerCase().includes('formação') || text.toLowerCase().includes('cadastro') || text.toLowerCase().includes('ensino'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://avamec.mec.gov.br${href}` : `https://avamec.mec.gov.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Cursos EAD Gratuitos - AVA MEC',
          description: `Curso online oferecido pela plataforma AVA MEC (Ministério da Educação). Faça seu cadastro e estude gratuitamente com certificação oficial.`,
          category: 'Capacitação',
          sourceName: 'Ministério da Educação (AVA)',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar AVA MEC: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Cursos Livres 100% Online e Gratuitos - AVA MEC',
        description: 'Acesse centenas de cursos de capacitação e formação continuada gratuitos na plataforma oficial de Ensino a Distância do Ministério da Educação (MEC).',
        category: 'Capacitação',
        sourceName: 'Ministério da Educação (AVA)',
        sourceUrl: 'https://avamec.mec.gov.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] AVA MEC: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar AVA MEC: ${err.message}`);
    const fallback = [{
      title: 'Cursos Livres 100% Online e Gratuitos - AVA MEC',
      description: 'Acesse centenas de cursos de capacitação e formação continuada gratuitos na plataforma oficial de Ensino a Distância do Ministério da Educação (MEC).',
      category: 'Capacitação',
      sourceName: 'Ministério da Educação (AVA)',
      sourceUrl: 'https://avamec.mec.gov.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 8. Scraping BNB Crediamigo
async function scrapeCrediamigo(prisma) {
  console.log('[Scraper] Iniciando coleta do BNB Crediamigo...');
  const opportunitiesList = [];
  try {
    const url = 'https://www.bnb.gov.br/crediamigo';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('edital') || text.toLowerCase().includes('crediamigo') || text.toLowerCase().includes('microcrédito') || text.toLowerCase().includes('orientação') || text.toLowerCase().includes('taxa'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://www.bnb.gov.br${href}` : `https://www.bnb.gov.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Orientação e Crédito - BNB Crediamigo',
          description: `Informações sobre microcrédito orientado, taxas especiais e prazos para microempreendedores individuais com o BNB Crediamigo.`,
          category: 'Crédito',
          sourceName: 'Banco do Nordeste',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar BNB Crediamigo: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Microcrédito e Empreendedorismo - BNB Crediamigo',
        description: 'Confira as linhas de microcrédito orientado, prazos, taxas e orientações financeiras do Banco do Nordeste para impulsionar o seu negócio.',
        category: 'Crédito',
        sourceName: 'Banco do Nordeste',
        sourceUrl: 'https://www.bnb.gov.br/crediamigo',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] BNB Crediamigo: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar BNB Crediamigo: ${err.message}`);
    const fallback = [{
      title: 'Microcrédito e Empreendedorismo - BNB Crediamigo',
      description: 'Confira as linhas de microcrédito orientado, prazos, taxas e orientações financeiras do Banco do Nordeste para impulsionar o seu negócio.',
      category: 'Crédito',
      sourceName: 'Banco do Nordeste',
      sourceUrl: 'https://www.bnb.gov.br/crediamigo',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// 9. Scraping Ceará Credi
async function scrapeCearaCredi(prisma) {
  console.log('[Scraper] Iniciando coleta do Ceará Credi...');
  const opportunitiesList = [];
  try {
    const url = 'https://cearacredi.ce.gov.br/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (href && (text.toLowerCase().includes('crédito') || text.toLowerCase().includes('ceará') || text.toLowerCase().includes('inscrição') || text.toLowerCase().includes('microcrédito') || text.toLowerCase().includes('financiamento'))) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `https://cearacredi.ce.gov.br${href}` : `https://cearacredi.ce.gov.br/${href}`;
        }

        opportunitiesList.push({
          title: text || 'Microcrédito Estadual - Ceará Credi',
          description: `Financiamento produtivo orientado do Governo do Ceará para apoiar pequenos negócios e trabalhadores autônomos.`,
          category: 'Crédito',
          sourceName: 'Governo do Ceará',
          sourceUrl: fullUrl,
          publishedDate: new Date()
        });
      }
    });

    if (opportunitiesList.length === 0) {
      console.warn('[Scraper Aviso] Falha ao raspar Ceará Credi: Nenhum item dinâmico encontrado. Usando fallback.');
      opportunitiesList.push({
        title: 'Programa de Microcrédito Produtivo - Ceará Credi',
        description: 'Acesse financiamento facilitado para microempreendedores, trabalhadores autônomos e cooperativas com o programa Ceará Credi do Governo do Estado.',
        category: 'Crédito',
        sourceName: 'Governo do Ceará',
        sourceUrl: 'https://cearacredi.ce.gov.br/',
        publishedDate: new Date()
      });
    }

    const inserted = await saveOpportunities(prisma, opportunitiesList);
    console.log(`[Scraper] Ceará Credi: ${inserted} itens encontrados/salvos.`);
    return inserted;
  } catch (err) {
    console.warn(`[Scraper Aviso] Falha ao raspar Ceará Credi: ${err.message}`);
    const fallback = [{
      title: 'Programa de Microcrédito Produtivo - Ceará Credi',
      description: 'Acesse financiamento facilitado para microempreendedores, trabalhadores autônomos e cooperativas com o programa Ceará Credi do Governo do Estado.',
      category: 'Crédito',
      sourceName: 'Governo do Ceará',
      sourceUrl: 'https://cearacredi.ce.gov.br/',
      publishedDate: new Date()
    }];
    return await saveOpportunities(prisma, fallback);
  }
}

// Função principal que orquestra todas as raspagens com resiliência isolada
async function scrapeOpportunities(prisma) {
  console.log('[Scraper] Iniciando varredura por novas oportunidades...');
  
  const scrapers = [
    { name: 'SINE/IDT', fn: () => scrapeSINE(prisma) },
    { name: 'IFCE Itapipoca', fn: () => scrapeIFCE(prisma) },
    { name: 'Prefeitura de Itapipoca', fn: () => scrapePrefeitura(prisma) },
    { name: 'SENAI/CE', fn: () => scrapeSENAI(prisma) },
    { name: 'SESC/CE', fn: () => scrapeSESC(prisma) },
    { name: 'SEBRAE', fn: () => scrapeSEBRAE(prisma) },
    { name: 'AVA MEC', fn: () => scrapeAVAMEC(prisma) },
    { name: 'BNB Crediamigo', fn: () => scrapeCrediamigo(prisma) },
    { name: 'Ceará Credi', fn: () => scrapeCearaCredi(prisma) }
  ];

  let totalInserted = 0;
  
  // Executa todas de forma assíncrona e isolada
  const results = await Promise.allSettled(scrapers.map(s => s.fn()));

  results.forEach((res, index) => {
    const name = scrapers[index].name;
    if (res.status === 'fulfilled') {
      totalInserted += res.value || 0;
    } else {
      console.error(`[Scraper Erro Crítico] Falha crítica na execução do scraper ${name}:`, res.reason);
    }
  });

  console.log(`[Scraper] Varredura concluída. ${totalInserted} novas oportunidades inseridas no total.`);
  return totalInserted;
}

// Configuração e inicialização do node-cron
function initScraper(prisma) {
  console.log('[Scraper] Inicializando Cron Job (agendado diariamente para às 03:00)...');

  // Roda todos os dias às 03:00 da manhã
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scraper Cron] Iniciando execução agendada das 03:00...');
    await cleanupOldOpportunities(prisma);
    await scrapeOpportunities(prisma);
  });

  // Executa uma primeira vez de forma assíncrona após 5 segundos da inicialização do servidor,
  // facilitando testes rápidos e garantindo que o mural não fique vazio no desenvolvimento.
  setTimeout(async () => {
    console.log('[Scraper] Iniciando execução de teste pós-inicialização...');
    await cleanupOldOpportunities(prisma);
    await scrapeOpportunities(prisma);
  }, 5000);
}

module.exports = {
  initScraper,
  scrapeOpportunities,
  cleanupOldOpportunities
};
