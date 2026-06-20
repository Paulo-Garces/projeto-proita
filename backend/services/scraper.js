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

// Função principal de raspagem (Esqueleto/Fallback robusto para IDT/SINE Itapipoca)
async function scrapeOpportunities(prisma) {
  console.log('[Scraper] Iniciando varredura por novas oportunidades...');
  try {
    const url = 'https://www.idt.org.br/vagas-de-emprego';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const opportunitiesList = [];

    // Tenta encontrar links para vagas contendo Itapipoca ou termos correlacionados
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

    // Se não encontrou links dinâmicos por alteração estrutural da página,
    // criamos sempre o registro de fallback atualizado para o usuário poder acessar a listagem oficial diariamente.
    if (opportunitiesList.length === 0) {
      opportunitiesList.push({
        title: 'Vagas de Emprego do SINE/IDT Itapipoca (Painel Oficial)',
        description: 'Confira as vagas de emprego ativas hoje na unidade do SINE/IDT de Itapipoca. Oportunidades para diversos setores como comércio, serviços e administrativo.',
        category: 'Empregos',
        sourceName: 'SINE Itapipoca / IDT',
        sourceUrl: 'https://www.idt.org.br/vagas-de-emprego',
        publishedDate: new Date()
      });
    }

    // Salvar no banco evitando duplicatas
    let insertedCount = 0;
    for (const opp of opportunitiesList) {
      // Usar $queryRaw para verificar se a URL já existe
      const existing = await prisma.$queryRaw`
        SELECT id FROM mural_oportunidades WHERE source_url = ${opp.sourceUrl} LIMIT 1
      `;

      if (existing && existing.length > 0) {
        continue;
      }

      // Inserir nova oportunidade no banco de dados Neon
      await prisma.$executeRaw`
        INSERT INTO mural_oportunidades (title, description, category, source_name, source_url, published_date)
        VALUES (${opp.title}, ${opp.description}, ${opp.category}, ${opp.sourceName}, ${opp.sourceUrl}, ${opp.publishedDate})
      `;
      insertedCount++;
    }

    console.log(`[Scraper] Varredura concluída. ${insertedCount} novas oportunidades inseridas.`);
  } catch (err) {
    console.error('[Scraper Error]:', err);
  }
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
