import React from 'react';

export default function About() {
  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Sobre o proITA</h1>
      <div className="prose prose-slate lg:prose-lg">
        <p className="text-slate-600 mb-4">
          O <strong>proITA</strong> nasceu de um desejo simples, mas poderoso: conectar os talentos e profissionais de Itapipoca diretamente com os cidadãos que precisam de seus serviços, de forma rápida, moderna e eficiente.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">Nossa Missão</h2>
        <p className="text-slate-600 mb-4">
          Acreditamos que nossa cidade possui profissionais de excelência em todas as áreas — da construção civil à tecnologia, da saúde à educação. O proITA atua como uma ponte digital, eliminando burocracias e facilitando o contato direto via WhatsApp.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">Para os Profissionais</h2>
        <p className="text-slate-600 mb-4">
          Oferecemos uma vitrine profissional para que carpinteiros, eletricistas, psicólogos, advogados e tantos outros possam ser encontrados por quem está na rua ao lado ou no bairro vizinho, aumentando suas oportunidades de trabalho.
        </p>
        <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">Para os Clientes</h2>
        <p className="text-slate-600">
          Chega de procurar contatos em grupos de redes sociais sem saber quem contratar. Aqui você encontra perfis detalhados, categorias organizadas e contato direto para resolver seu problema em poucos cliques.
        </p>
      </div>
    </div>
  );
}