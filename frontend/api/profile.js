export default async function handler(req, res) {
  const { slug } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|facebook|whatsapp|google|twitter|telegram|skype|linkedin/i.test(userAgent);
  const requestHost = req.headers.host || 'www.proita.com.br';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const homeUrl = `${protocol}://${requestHost}/`;

  try {
    let html = await (await fetch(homeUrl)).text();
    if (!isBot) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const backendUrl = process.env.BACKEND_API_URL || 'https://projeto-proita.onrender.com';
    console.log(`[BOT DETECTADO] Buscando dados de: ${slug}`);

    if (slug) {
      const response = await fetch(`${backendUrl}/api/ads/${slug}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const ad = result.data;
          const displayName = [ad.nomeExibicao, ad.sobrenomeExibicao].filter(Boolean).join(' ').trim() || [ad.user?.nome, ad.user?.sobrenome].filter(Boolean).join(' ').trim() || 'Profissional';
          const category = ad.atividadePrincipal || 'Profissional';
          const locationName = ad.serviceBairro || ad.user?.bairro || 'Itapipoca';
          const avatar = ad.fotoAnuncioUrl || ad.user?.profileImageUrl || ad.avatarUrl || 'https://www.proita.com.br/logo-padrao.png';
          let absoluteImageUrl = avatar.startsWith('http') ? avatar : `${protocol}://${requestHost}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
          const title = `${displayName} - ${category} em ${locationName} | proITA`;

          const metaTags = `
            <meta name="title" content="${title}">
            <meta property="og:type" content="profile">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="Confira os serviços e entre em contato!">
            <meta property="og:image" content="${absoluteImageUrl}">
            <meta property="og:url" content="${protocol}://${requestHost}/profile/${slug}">
            <meta name="twitter:card" content="summary">
          `;

          html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
          html = html.replace(/<meta property="og:.*?>/gi, '');
          html = html.replace('</head>', `${metaTags}\n</head>`);
        }
      }
    }
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('[ERRO SSR] Falha ao processar Open Graph:', err);
    res.redirect(302, '/');
  }
}