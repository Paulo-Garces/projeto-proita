import React from 'react';

export default function Terms() {
  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Termos de Uso</h1>
      <div className="space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">1. Aceitação dos Termos</h2>
          <p>Ao acessar o proITA, você concorda em cumprir estes termos de serviço e todas as leis e regulamentos aplicáveis.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">2. Responsabilidade do Serviço</h2>
          <p>O proITA é uma plataforma de anúncios e intermediação de contatos. Não somos responsáveis pela execução, qualidade ou garantia dos serviços prestados pelos profissionais cadastrados. Todo o acordo de valores e prazos é feito diretamente entre cliente e profissional.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">3. Conteúdo dos Anúncios</h2>
          <p>Os profissionais são inteiramente responsáveis pela veracidade das informações fornecidas em seus perfis. Anúncios com informações falsas ou impróprias serão removidos sem aviso prévio.</p>
        </section>
      </div>
    </div>
  );
}