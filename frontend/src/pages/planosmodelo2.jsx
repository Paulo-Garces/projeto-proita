<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>proITA — Planos e Preços</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --serra:#20513F;
    --serra-deep:#153B2E;
    --sertao:#E08A3E;
    --sertao-deep:#B96A24;
    --litoral:#1F6E82;
    --litoral-deep:#134E5D;
    --noite:#0D2B2E;
    --areia:#F4EDDD;
    --areia-2:#EAE0C8;
    --ink:#0F2A28;
    --gold:#F0B94D;
    --white:#FFFFFF;
    --line: rgba(244,237,221,0.18);
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    margin:0;
    background:var(--noite);
    color:var(--areia);
    font-family:'Inter', sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  h1,h2,h3, .display{
    font-family:'Fraunces', serif;
    font-optical-sizing:auto;
    margin:0;
  }
  .num{
    font-family:'Space Grotesk', monospace;
  }
  a{color:inherit;}
  .wrap{
    max-width:1120px;
    margin:0 auto;
    padding:0 28px;
  }

  /* ---------- NAV ---------- */
  nav{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:20px 28px;
    max-width:1120px;
    margin:0 auto;
  }
  .brand{
    display:flex;
    align-items:center;
    gap:10px;
    font-family:'Fraunces', serif;
    font-weight:600;
    font-size:1.15rem;
    letter-spacing:0.01em;
  }
  .brand-mark{
    width:30px;height:30px;border-radius:50%;
    background:conic-gradient(from 210deg, var(--litoral), var(--sertao), var(--serra), var(--litoral));
    flex-shrink:0;
  }
  .nav-links{display:flex; gap:28px; font-size:0.92rem; color:rgba(244,237,221,0.75);}
  .nav-links span{display:none;}
  @media(min-width:760px){ .nav-links span{display:inline;} }

  /* ---------- HERO ---------- */
  .hero{
    position:relative;
    overflow:hidden;
    padding-top:64px;
    padding-bottom:40px;
  }
  .hero-inner{
    position:relative;
    z-index:2;
    text-align:center;
    padding:20px 28px 0;
  }
  .eyebrow{
    display:inline-flex;
    align-items:center;
    gap:8px;
    font-family:'Space Grotesk', monospace;
    font-size:0.72rem;
    letter-spacing:0.16em;
    text-transform:uppercase;
    color:var(--gold);
    border:1px solid rgba(240,185,77,0.4);
    padding:7px 16px;
    border-radius:999px;
    margin-bottom:26px;
  }
  .hero h1{
    font-size:clamp(2.3rem, 5.5vw, 4.1rem);
    line-height:1.05;
    font-weight:600;
    max-width:820px;
    margin:0 auto;
    letter-spacing:-0.01em;
  }
  .hero h1 em{
    font-style:italic;
    color:var(--sertao);
  }
  .hero p.sub{
    max-width:520px;
    margin:22px auto 0;
    font-size:1.05rem;
    line-height:1.6;
    color:rgba(244,237,221,0.78);
  }
  .hero-ctas{
    display:flex;
    justify-content:center;
    gap:14px;
    flex-wrap:wrap;
    margin-top:34px;
  }
  .btn{
    font-family:'Inter', sans-serif;
    font-weight:600;
    font-size:0.94rem;
    padding:14px 26px;
    border-radius:10px;
    border:none;
    cursor:pointer;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    gap:8px;
    transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
  }
  .btn-primary{
    background:var(--sertao);
    color:var(--noite);
  }
  .btn-primary:hover{ transform:translateY(-2px); box-shadow:0 10px 24px rgba(224,138,62,0.35); }
  .btn-ghost{
    background:transparent;
    color:var(--areia);
    border:1px solid var(--line);
  }
  .btn-ghost:hover{ background:rgba(244,237,221,0.06); }

  /* layered horizon */
  .horizon{
    position:absolute;
    inset:0;
    z-index:1;
    pointer-events:none;
  }
  .horizon svg{ width:100%; height:100%; display:block; }

  /* ---------- TRIAL STRIP ---------- */
  .trial-strip{
    background:var(--areia);
    color:var(--ink);
    padding:22px 28px;
  }
  .trial-strip .wrap{
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    justify-content:center;
    gap:34px;
    text-align:center;
  }
  .trial-item{
    display:flex;
    align-items:center;
    gap:9px;
    font-size:0.92rem;
    font-weight:600;
  }
  .trial-item svg{ flex-shrink:0; }

  /* ---------- PLANS SECTION ---------- */
  .plans-section{
    padding:88px 0 40px;
  }
  .section-head{
    text-align:center;
    margin-bottom:20px;
  }
  .section-head .kicker{
    font-family:'Space Grotesk', monospace;
    font-size:0.72rem;
    letter-spacing:0.16em;
    text-transform:uppercase;
    color:var(--litoral);
    filter:brightness(1.6);
  }
  .section-head h2{
    font-size:clamp(1.8rem,3.4vw,2.5rem);
    font-weight:600;
    margin-top:10px;
  }
  .section-head p{
    color:rgba(244,237,221,0.68);
    max-width:480px;
    margin:14px auto 0;
    font-size:0.98rem;
  }

  /* toggle */
  .toggle-wrap{
    display:flex;
    justify-content:center;
    margin:36px 0 56px;
  }
  .toggle{
    display:inline-flex;
    background:rgba(244,237,221,0.07);
    border:1px solid var(--line);
    border-radius:999px;
    padding:5px;
    position:relative;
  }
  .toggle button{
    position:relative;
    z-index:2;
    background:none;
    border:none;
    color:rgba(244,237,221,0.65);
    font-family:'Inter';
    font-weight:600;
    font-size:0.88rem;
    padding:10px 22px;
    border-radius:999px;
    cursor:pointer;
    display:flex;
    align-items:center;
    gap:8px;
    transition:color .2s ease;
  }
  .toggle button.active{ color:var(--noite); }
  .toggle .pill{
    position:absolute;
    top:5px; bottom:5px; left:5px;
    width:calc(50% - 5px);
    background:var(--gold);
    border-radius:999px;
    transition:transform .28s cubic-bezier(.4,0,.2,1);
    z-index:1;
  }
  .toggle button[data-mode="bienal"].active ~ .pill,
  .toggle.bienal .pill{ transform:translateX(100%); }
  .save-tag{
    font-size:0.68rem;
    background:var(--serra);
    color:var(--areia);
    padding:2px 8px;
    border-radius:999px;
    font-family:'Space Grotesk';
  }
  .toggle button.active .save-tag{ background:var(--noite); color:var(--gold); }

  /* cards */
  .cards{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:22px;
    align-items:stretch;
  }
  @media(max-width:880px){ .cards{ grid-template-columns:1fr; max-width:420px; margin:0 auto; } }

  .card{
    background:rgba(244,237,221,0.045);
    border:1px solid var(--line);
    border-radius:20px;
    padding:30px 26px 28px;
    display:flex;
    flex-direction:column;
    position:relative;
    overflow:hidden;
  }
  .card.featured{
    background:linear-gradient(165deg, rgba(224,138,62,0.14), rgba(224,138,62,0.02));
    border-color:rgba(240,185,77,0.55);
  }
  .card-badge{
    position:absolute;
    top:18px; right:18px;
    font-family:'Space Grotesk';
    font-size:0.66rem;
    letter-spacing:0.08em;
    text-transform:uppercase;
    background:var(--gold);
    color:var(--noite);
    padding:5px 11px;
    border-radius:999px;
    font-weight:700;
  }
  .climate-icon{
    width:44px;height:44px;
    border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    margin-bottom:20px;
  }
  .climate-icon.litoral{ background:rgba(31,110,130,0.35); }
  .climate-icon.sertao{ background:rgba(224,138,62,0.28); }
  .climate-icon.serra{ background:rgba(32,81,63,0.4); }

  .card-tier{
    font-family:'Space Grotesk';
    font-size:0.7rem;
    letter-spacing:0.12em;
    text-transform:uppercase;
    color:rgba(244,237,221,0.5);
    margin-bottom:6px;
  }
  .card h3{
    font-size:1.5rem;
    font-weight:600;
    margin-bottom:8px;
  }
  .card .desc{
    font-size:0.88rem;
    color:rgba(244,237,221,0.62);
    line-height:1.5;
    margin-bottom:22px;
    min-height:42px;
  }
  .price-row{
    display:flex;
    align-items:baseline;
    gap:6px;
    margin-bottom:2px;
  }
  .price-row .currency{ font-size:1.1rem; color:rgba(244,237,221,0.7); }
  .price-row .amount{ font-size:2.5rem; font-weight:700; letter-spacing:-0.01em; }
  .price-row .period{ font-size:0.88rem; color:rgba(244,237,221,0.55); }
  .price-month{
    font-size:0.82rem;
    color:rgba(244,237,221,0.5);
    margin-bottom:22px;
  }
  .price-month strong{ color:var(--gold); font-weight:600; }
  .savings{
    display:inline-block;
    font-size:0.76rem;
    color:var(--serra);
    filter:brightness(1.7);
    font-weight:600;
    margin-bottom:22px;
    margin-top:-14px;
  }
  ul.feat{
    list-style:none;
    padding:0; margin:0 0 26px;
    display:flex; flex-direction:column; gap:11px;
    flex-grow:1;
  }
  ul.feat li{
    display:flex;
    gap:10px;
    font-size:0.88rem;
    color:rgba(244,237,221,0.85);
    line-height:1.4;
  }
  ul.feat li svg{ flex-shrink:0; margin-top:2px; }
  ul.feat li.extra{
    color:var(--gold);
    font-weight:600;
    border-top:1px dashed rgba(240,185,77,0.3);
    padding-top:11px;
    margin-top:2px;
  }
  .card .cta{
    width:100%;
    text-align:center;
    justify-content:center;
    padding:13px 20px;
  }
  .cta-free{ background:transparent; border:1.5px solid var(--areia); color:var(--areia); }
  .cta-free:hover{ background:var(--areia); color:var(--noite); }
  .cta-pro{ background:var(--areia); color:var(--noite); }
  .cta-pro:hover{ transform:translateY(-2px); }
  .cta-patro{ background:var(--gold); color:var(--noite); }
  .cta-patro:hover{ transform:translateY(-2px); box-shadow:0 10px 24px rgba(240,185,77,0.3); }

  /* ---------- FEATURES GRID ---------- */
  .features-band{
    padding:70px 0;
    border-top:1px solid var(--line);
    border-bottom:1px solid var(--line);
    margin-top:40px;
  }
  .feat-grid{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:1px;
    background:var(--line);
    border:1px solid var(--line);
    border-radius:16px;
    overflow:hidden;
    margin-top:40px;
  }
  @media(max-width:760px){ .feat-grid{ grid-template-columns:1fr; } }
  .feat-cell{
    background:var(--noite);
    padding:26px 24px;
    display:flex;
    gap:14px;
    align-items:flex-start;
  }
  .feat-cell .ic{
    width:36px;height:36px;
    border-radius:9px;
    background:rgba(244,237,221,0.07);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .feat-cell h4{ font-size:0.95rem; font-weight:600; margin-bottom:4px; font-family:'Inter'; }
  .feat-cell p{ font-size:0.82rem; color:rgba(244,237,221,0.58); margin:0; line-height:1.4; }

  /* ---------- PROFILE PREVIEW ---------- */
  .preview-section{ padding:88px 0; }
  .preview-layout{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:56px;
    align-items:center;
    margin-top:44px;
  }
  @media(max-width:820px){ .preview-layout{ grid-template-columns:1fr; } }

  .phone-card{
    background:var(--areia);
    color:var(--ink);
    border-radius:20px;
    padding:22px;
    box-shadow:0 30px 60px rgba(0,0,0,0.35);
    position:relative;
  }
  .phone-card .top-row{ display:flex; gap:14px; align-items:center; }
  .avatar{
    width:58px;height:58px;
    border-radius:50%;
    background:linear-gradient(135deg, var(--sertao), var(--gold));
    display:flex; align-items:center; justify-content:center;
    font-family:'Fraunces'; font-weight:600; font-size:1.3rem; color:var(--noite);
    flex-shrink:0;
  }
  .phone-card .name{ font-family:'Fraunces'; font-weight:600; font-size:1.1rem; }
  .phone-card .stars{ color:var(--sertao); font-size:0.78rem; margin-top:2px; }
  .phone-card .meta{ font-size:0.8rem; color:rgba(15,42,40,0.6); margin-top:3px; display:flex; align-items:center; gap:5px; }
  .badge-service{
    display:inline-block;
    margin-top:12px;
    background:var(--litoral);
    color:var(--white);
    font-size:0.68rem;
    font-weight:700;
    letter-spacing:0.05em;
    text-transform:uppercase;
    padding:5px 10px;
    border-radius:6px;
  }
  .phone-actions{
    display:flex;
    gap:10px;
    margin-top:18px;
  }
  .icon-circle{
    width:42px;height:42px;
    border-radius:50%;
    background:rgba(15,42,40,0.06);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .icon-circle.whats{ background:#25D366; flex:1; border-radius:12px; }
  .verified-ribbon{
    position:absolute;
    top:-10px; right:18px;
    background:var(--gold);
    color:var(--noite);
    font-size:0.65rem;
    font-weight:700;
    padding:5px 12px;
    border-radius:999px;
    box-shadow:0 6px 14px rgba(240,185,77,0.4);
  }

  .preview-text .kicker{
    font-family:'Space Grotesk'; font-size:0.72rem; letter-spacing:0.16em;
    text-transform:uppercase; color:var(--sertao); filter:brightness(1.3);
  }
  .preview-text h2{ font-size:clamp(1.6rem,3vw,2.1rem); font-weight:600; margin-top:12px; }
  .preview-text p.lead{ color:rgba(244,237,221,0.68); margin-top:14px; line-height:1.6; font-size:0.98rem; max-width:420px;}
  .mini-list{ margin-top:26px; display:flex; flex-direction:column; gap:16px; }
  .mini-list .row{ display:flex; gap:14px; }
  .mini-list .row .num-badge{
    font-family:'Space Grotesk'; font-weight:700; font-size:0.78rem;
    width:26px;height:26px; border-radius:50%;
    background:rgba(244,237,221,0.08); color:var(--gold);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .mini-list .row div h5{ font-size:0.92rem; font-weight:600; margin:0 0 3px; font-family:'Inter'; }
  .mini-list .row div p{ font-size:0.83rem; color:rgba(244,237,221,0.55); margin:0; line-height:1.4; }

  /* ---------- FINAL CTA ---------- */
  .final-cta{
    margin:40px 28px 90px;
    max-width:1064px;
    margin-left:auto; margin-right:auto;
    background:linear-gradient(135deg, var(--litoral-deep), var(--serra-deep) 55%, var(--sertao-deep));
    border-radius:26px;
    padding:70px 40px;
    text-align:center;
    position:relative;
    overflow:hidden;
  }
  .final-cta h2{ font-size:clamp(1.8rem,3.6vw,2.6rem); font-weight:600; max-width:600px; margin:0 auto; position:relative; z-index:2; }
  .final-cta p{ color:rgba(244,237,221,0.8); margin:16px auto 30px; max-width:440px; position:relative; z-index:2; }
  .final-cta .hero-ctas{ position:relative; z-index:2; }

  footer{
    border-top:1px solid var(--line);
    padding:40px 28px 30px;
    text-align:center;
    font-size:0.82rem;
    color:rgba(244,237,221,0.45);
  }
  footer .brand{ justify-content:center; margin-bottom:10px; color:rgba(244,237,221,0.8); }

  @media (prefers-reduced-motion: reduce){
    *{ transition:none !important; }
  }
</style>
</head>
<body>

<nav>
  <div class="brand"><span class="brand-mark"></span> proITA</div>
  <div class="nav-links">
    <span>Início</span><span>Explorar</span><span>Mural</span><span>Suporte</span>
  </div>
</nav>

<section class="hero">
  <div class="horizon">
    <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,220 C220,150 420,260 620,190 C820,120 1000,210 1200,160 L1200,0 L0,0 Z" fill="var(--serra-deep)" opacity="0.55"/>
      <path d="M0,300 C260,240 460,330 700,270 C900,222 1050,290 1200,250 L1200,0 L0,0 Z" fill="var(--serra)" opacity="0.35"/>
      <path d="M0,360 C240,330 500,400 760,350 C960,312 1080,360 1200,340 L1200,520 L0,520 Z" fill="var(--sertao-deep)" opacity="0.28"/>
      <path d="M0,430 C260,400 520,455 800,415 C980,390 1090,420 1200,410 L1200,520 L0,520 Z" fill="var(--litoral-deep)" opacity="0.55"/>
      <path d="M0,470 C280,450 540,495 820,465 C1000,445 1100,468 1200,460 L1200,520 L0,520 Z" fill="var(--litoral)" opacity="0.6"/>
    </svg>
  </div>
  <div class="hero-inner">
    <span class="eyebrow">★ O guia dos três climas</span>
    <h1>Seu serviço visto na <em>serra</em>, no <em>sertão</em><br>e no <em>litoral</em> de Itapipoca.</h1>
    <p class="sub">Um perfil profissional, avaliações reais e clientes chegando pelo WhatsApp. Comece hoje, teste por 30 dias sem gastar nada.</p>
    <div class="hero-ctas">
      <a href="#planos" class="btn btn-primary">Começar grátis por 30 dias</a>
      <a href="#planos" class="btn btn-ghost">Ver planos ↓</a>
    </div>
  </div>
</section>

<div class="trial-strip">
  <div class="wrap">
    <div class="trial-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      30 dias 100% grátis
    </div>
    <div class="trial-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Sem cartão de crédito
    </div>
    <div class="trial-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Sem cobrança automática
    </div>
  </div>
</div>

<section class="plans-section" id="planos">
  <div class="wrap">
    <div class="section-head">
      <span class="kicker">Planos</span>
      <h2>Escolha até onde seu anúncio chega</h2>
      <p>Preço claro, sem letra miúda. Quanto mais alto o plano, mais visibilidade seu perfil ganha.</p>
    </div>

    <div class="toggle-wrap">
      <div class="toggle" id="toggle">
        <button data-mode="anual" class="active" onclick="setBilling('anual')">Anual</button>
        <button data-mode="bienal" onclick="setBilling('bienal')">Bienal <span class="save-tag">economize</span></button>
        <span class="pill"></span>
      </div>
    </div>

    <div class="cards">

      <!-- GRÁTIS -->
      <div class="card">
        <div class="climate-icon litoral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 18c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" stroke="var(--litoral)" stroke-width="2" stroke-linecap="round"/><path d="M2 13c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" stroke="var(--litoral)" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg>
        </div>
        <div class="card-tier">Litoral · entrada</div>
        <h3>Grátis</h3>
        <p class="desc">Pra testar a plataforma com calma antes de decidir se vale a pena.</p>
        <div class="price-row">
          <span class="amount">R$0</span>
          <span class="period">/ 30 dias</span>
        </div>
        <div class="price-month">Depois, seu anúncio fica pausado até você decidir continuar.</div>
        <ul class="feat">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Perfil completo no proITA
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Todas as funcionalidades liberadas
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Cancele quando quiser, sem custo
          </li>
        </ul>
        <a href="#" class="btn cta cta-free">Começar grátis</a>
      </div>

      <!-- PROFISSIONAL -->
      <div class="card featured">
        <span class="card-badge" id="badge-pro" style="display:none;">Melhor custo-benefício</span>
        <div class="climate-icon sertao">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="var(--sertao)" stroke-width="2"/><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M18.1 5.9l-1.5 1.5M7.4 16.6l-1.5 1.5" stroke="var(--sertao)" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="card-tier">Sertão · crescimento</div>
        <h3>Profissional</h3>
        <p class="desc">Presença profissional completa, com o maior custo-benefício da plataforma.</p>
        <div class="price-row">
          <span class="currency">R$</span>
          <span class="amount num" id="pro-price">35,90</span>
          <span class="period" id="pro-period">/ano</span>
        </div>
        <div class="price-month" id="pro-month">Equivalente a <strong>R$2,99/mês</strong></div>
        <ul class="feat">
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Avaliações e notas completas</li>
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Portfólio de serviços com fotos</li>
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Selo de reputação (Bronze/Prata/Ouro)</li>
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Estatísticas de acesso e desempenho</li>
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Até 2 anúncios simultâneos</li>
        </ul>
        <a href="#" class="btn cta cta-pro">Assinar Profissional</a>
      </div>

      <!-- PATROCINADOR -->
      <div class="card featured" style="border-color:rgba(240,185,77,0.7);">
        <span class="card-badge">Recomendado</span>
        <div class="climate-icon serra">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 19h18L14 6l-3.5 6L8 8 3 19Z" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/></svg>
        </div>
        <div class="card-tier">Serra · topo</div>
        <h3>Patrocinador</h3>
        <p class="desc">Tudo do Profissional, mais o Espaço Parceiro pra monetizar seu perfil.</p>
        <div class="price-row">
          <span class="currency">R$</span>
          <span class="amount num" id="patro-price">45,90</span>
          <span class="period" id="patro-period">/ano</span>
        </div>
        <div class="price-month" id="patro-month">Equivalente a <strong>R$3,82/mês</strong></div>
        <div class="savings" id="patro-save" style="visibility:hidden;">Economize R$11,90 no plano bienal</div>
        <ul class="feat">
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Tudo do plano Profissional</li>
          <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--serra)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Prioridade nos resultados de busca</li>
          <li class="extra">🏆 Espaço Parceiro: revenda até 3 cotas publicitárias e gere renda extra</li>
        </ul>
        <a href="#" class="btn cta cta-patro">Assinar Patrocinador</a>
      </div>

    </div>
  </div>
</section>

<div class="features-band">
  <div class="wrap">
    <div class="section-head">
      <span class="kicker">Sempre incluso</span>
      <h2>O que todo plano pago carrega</h2>
    </div>
    <div class="feat-grid">
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="var(--gold)" stroke-width="2"/></svg></div>
        <div><h4>30 dias de teste grátis</h4><p>Todo plano pago começa com um mês pra você experimentar sem risco.</p></div>
      </div>
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.87" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div><h4>Até 2 anúncios simultâneos</h4><p>Divulgue mais de um serviço com o mesmo perfil.</p></div>
      </div>
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18M7 15l4-4 3 3 5-6" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div><h4>Estatísticas de desempenho</h4><p>Acompanhe visitas, cliques e contatos recebidos.</p></div>
      </div>
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.5 6.5L21 10l-5.5 4L17 21l-5-3.5L7 21l1.5-7L3 10l6.5-1.5L12 2Z" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/></svg></div>
        <div><h4>Selos de reputação</h4><p>Bronze, prata e ouro conforme suas avaliações crescem.</p></div>
      </div>
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="var(--gold)" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="var(--gold)" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="var(--gold)" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="var(--gold)" stroke-width="2"/></svg></div>
        <div><h4>Portfólio com fotos</h4><p>Mostre seus trabalhos direto no perfil.</p></div>
      </div>
      <div class="feat-cell">
        <div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2 3 14h7l-1 8 11-13h-8l1-7Z" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/></svg></div>
        <div><h4>Categorização por IA</h4><p>Seu serviço aparece nas buscas certas, automaticamente.</p></div>
      </div>
    </div>
  </div>
</div>

<section class="preview-section">
  <div class="wrap">
    <div class="preview-layout">
      <div class="phone-card">
        <span class="verified-ribbon">Verificado ★ Ouro</span>
        <div class="top-row">
          <div class="avatar">MA</div>
          <div>
            <div class="name">Marcos Andrade</div>
            <div class="stars">★★★★★ 4.9 (62 avaliações)</div>
            <div class="meta">📍 Centro, Itapipoca</div>
          </div>
        </div>
        <span class="badge-service">Marceneiro</span>
        <div class="phone-actions">
          <div class="icon-circle"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.09 9.63a16 16 0 0 0 6 6l1.18-1.2a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z" stroke="var(--ink)" stroke-width="1.8"/></svg></div>
          <div class="icon-circle whats"><svg width="19" height="19" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-3 .78.8-2.93-.19-.3A7.94 7.94 0 1 1 12 20Z"/></svg></div>
          <div class="icon-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="var(--ink)" stroke-width="1.8"/><circle cx="6" cy="12" r="3" stroke="var(--ink)" stroke-width="1.8"/><circle cx="18" cy="19" r="3" stroke="var(--ink)" stroke-width="1.8"/><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" stroke="var(--ink)" stroke-width="1.8"/></svg></div>
        </div>
      </div>

      <div class="preview-text">
        <span class="kicker">Como aparece pro cliente</span>
        <h2>Um cartão simples, feito pra fechar contato.</h2>
        <p class="lead">Perfil fictício apenas pra ilustrar — assim que o seu ficaria pronto pra receber cliques.</p>
        <div class="mini-list">
          <div class="row">
            <div class="num-badge">1</div>
            <div><h5>Nota e selo à vista</h5><p>Reputação e verificação aparecem antes de qualquer coisa.</p></div>
          </div>
          <div class="row">
            <div class="num-badge">2</div>
            <div><h5>Botão de WhatsApp direto</h5><p>Cliente chama sem precisar sair da tela.</p></div>
          </div>
          <div class="row">
            <div class="num-badge">3</div>
            <div><h5>Categoria clara</h5><p>Fica fácil saber, de cara, que serviço você oferece.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="final-cta wrap">
  <h2>Pronto pra aparecer nos três climas de Itapipoca?</h2>
  <p>Comece grátis agora. Se fizer sentido pra você, escolhe um plano depois.</p>
  <div class="hero-ctas">
    <a href="#planos" class="btn btn-primary">Começar grátis por 30 dias</a>
  </div>
</div>

<footer>
  <div class="brand"><span class="brand-mark"></span> proITA</div>
  © 2026 proITA — O Guia dos Três Climas. Todos os direitos reservados.
</footer>

<script>
  const prices = {
    pro: {
      anual: { price:'35,90', period:'/ano', month:'2,99' },
      bienal:{ price:'59,90', period:'/2 anos', month:'2,49' }
    },
    patro: {
      anual: { price:'45,90', period:'/ano', month:'3,82' },
      bienal:{ price:'79,90', period:'/2 anos', month:'3,32' }
    }
  };

  function setBilling(mode){
    document.getElementById('toggle').classList.toggle('bienal', mode === 'bienal');
    document.querySelectorAll('#toggle button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    document.getElementById('pro-price').textContent = prices.pro[mode].price;
    document.getElementById('pro-period').textContent = prices.pro[mode].period;
    document.getElementById('pro-month').innerHTML = 'Equivalente a <strong>R$' + prices.pro[mode].month + '/mês</strong>';

    document.getElementById('patro-price').textContent = prices.patro[mode].price;
    document.getElementById('patro-period').textContent = prices.patro[mode].period;
    document.getElementById('patro-month').innerHTML = 'Equivalente a <strong>R$' + prices.patro[mode].month + '/mês</strong>';

    const badge = document.getElementById('badge-pro');
    badge.style.display = mode === 'bienal' ? 'inline-block' : 'none';

    const save = document.getElementById('patro-save');
    save.style.visibility = mode === 'bienal' ? 'visible' : 'hidden';
  }
</script>

</body>
</html>