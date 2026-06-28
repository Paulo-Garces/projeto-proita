import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;
  const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
  
  let html;
  try {
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch (err) {
    console.error('Erro ao ler index.html:', err);
    res.status(500).send('Erro interno do servidor ao ler template HTML');
    return;
  }

  // 1. Limpa as tags og genéricas antigas do HTML
  html = html.replace(/<meta property="og:title" [^>]+>/gi, '');
  html = html.replace(/<meta property="og:description" [^>]+>/gi, '');
  html = html.replace(/<meta property="og:image" [^>]+>/gi, '');

  if (!slug) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  try {
    const backendUrl = process.env.VITE_API_URL || 'http://localhost:5000';
    console.log(`[Vercel SSR] Buscando dados do perfil para slug: ${slug} em ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/api/ads/${slug}`);
    if (!response.ok) {
      console.warn(`[Vercel SSR] Backend retornou status ${response.status} para slug ${slug}`);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const result = await response.json();
    if (result.success && result.data) {
      const ad = result.data;
      
      // Reconstrói o nome de exibição (mesma lógica do original)
      const hasNomeExibicao = ad.nomeExibicao != null && String(ad.nomeExibicao).trim() !== '';
      const hasSobrenomeExibicao = ad.sobrenomeExibicao != null && String(ad.sobrenomeExibicao).trim() !== '';
      let displayName = 'Profissional';
      
      if (hasNomeExibicao || hasSobrenomeExibicao) {
        const nome = hasNomeExibicao ? String(ad.nomeExibicao).trim() : '';
        const sob = hasSobrenomeExibicao ? String(ad.sobrenomeExibicao).trim() : '';
        displayName = [nome, sob].filter(Boolean).join(' ').trim();
      } else {
        const nome = ad.user?.nome != null ? String(ad.user.nome).trim() : '';
        const sob = ad.user?.sobrenome != null ? String(ad.user.sobrenome).trim() : '';
        displayName = [nome, sob].filter(Boolean).join(' ').trim() || 'Profissional';
      }

      const category = ad.atividadePrincipal || 'Profissional';
      const locationName = ad.serviceBairro || ad.user?.bairro || 'Itapipoca';
      const avatar = (ad.fotoAnuncioUrl && ad.fotoAnuncioUrl.trim() !== '')
        ? ad.fotoAnuncioUrl.trim()
        : (ad.user?.profileImageUrl || ad.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&bold=true`);
      const capa = ad.capaUrl || avatar;

      const title = `${displayName} - ${category} em ${locationName} | proITA`;

      // Garante que a foto do profissional seja uma URL absoluta http...
      let absoluteImageUrl = capa;
      if (capa && !capa.startsWith('http://') && !capa.startsWith('https://')) {
        const relativePath = capa.startsWith('/') ? capa : `/${capa}`;
        const requestHost = req.headers.host || 'www.proita.com.br';
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        absoluteImageUrl = `${protocol}://${requestHost}${relativePath}`;
      }

      // Atualiza o título da página no HTML
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

      // Injeta as novas meta tags de redes sociais exatamente antes do fechamento da tag </head>
      const metaTags = `
    <meta property="og:title" content="${displayName} | proITA">
    <meta property="og:description" content="Confira os serviços e entre em contato!">
    <meta property="og:image" content="${absoluteImageUrl}">
      `.trim();

      html = html.replace('</head>', `${metaTags}\n</head>`);
    }
  } catch (err) {
    console.error('[Vercel SSR Error] Falha ao injetar Open Graph:', err);
  }

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
