import React from 'react';

export default function Privacy() {
  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Política de Privacidade</h1>
      <div className="space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Coleta de Dados</h2>
          <p>Coletamos informações básicas como nome, telefone e localização para permitir que clientes encontrem profissionais próximos em Itapipoca.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Uso das Informações</h2>
          <p>Seus dados de contato (WhatsApp) são exibidos publicamente apenas se você criar um anúncio como profissional, com o objetivo explícito de permitir que clientes entrem em contato com você.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Segurança</h2>
          <p>Tratamos seus dados com o máximo de respeito e segurança. Não vendemos suas informações para terceiros nem as utilizamos para envio de spam.</p>
        </section>
      </div>
    </div>
  );
}