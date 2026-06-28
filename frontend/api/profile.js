export default async function handler(req, res) {
  const { slug } = req.query;
  
  let html = '';
  try {
    // Obtém o host e protocolo dinamicamente para buscar o HTML base da própria Home
    const requestHost = req.headers.host || 'www.proita.com.br';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const homeUrl = `${protocol}://${requestHost}/`;
    
    console.log(`[Vercel SSR] Buscando HTML base de: ${homeUrl}`);
    const responseBase = await fetch(homeUrl);
    if (!responseBase.ok) {
      throw new Error(`Falha ao obter HTML base: ${responseBase.status}`);
    }
    html = await responseBase.text();
  } catch (err) {
    console.error('[Vercel SSR HTML Error] Erro ao buscar HTML base:', err);
    // Fallback mínimo se a própria Home estiver inacessível
    html = `<!DOCTYPE html><html lang="pt-BR"><head><title>proITA</title></head><body><div id="root"></div></body></html>`;
  }

  try {
    // 1. Limpa as tags og genéricas antigas do HTML
    html = html.replace(/<meta property="og:title" [^>]+>/gi, '');
    html = html.replace(/<meta property="og:description" [^>]+>/gi, '');
    html = html.replace(/<meta property="og:image" [^>]+>/gi, '');

    if (slug) {
      const backendUrl = process.env.VITE_API_URL || 'http://localhost:5000';
      console.log(`[Vercel SSR] Buscando dados do perfil para slug: ${slug} em ${backendUrl}`);
      
      const response = await fetch(`${backendUrl}/api/ads/${slug}`);
      if (response.ok) {
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
      } else {
        console.warn(`[Vercel SSR] Backend retornou status ${response.status} para slug ${slug}`);
      }
    }
  } catch (err) {
    console.error('[Vercel SSR Error] Falha ao processar ou injetar Open Graph:', err);
    // Retorna o HTML obtido mesmo em caso de erro na consulta ou substituição
  }

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
