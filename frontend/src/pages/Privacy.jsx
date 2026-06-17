import React from 'react';
import { ShieldAlert, ShieldCheck, Info, Eye } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
        {/* Título */}
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Política de Privacidade</h1>
        <p className="text-slate-500 mb-8 text-sm">Última atualização: Junho de 2026</p>

        {/* Resumo Legal Design */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 animate-pulse" size={22} />
            Resumo Prático (Como cuidamos dos seus dados):
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">1</span>
              <p><strong>Não vendemos seus dados:</strong> Suas informações servem apenas para o funcionamento do proITA.</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">2</span>
              <p><strong>Pagamento Seguro:</strong> Não salvamos o número do seu cartão de crédito. Isso é processado por sistemas bancários blindados (Inter/InfinitePay).</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">3</span>
              <p><strong>Visibilidade Pública:</strong> Lembre-se de que os dados do seu perfil profissional (telefone, endereço) ficarão visíveis para todos no Google e na plataforma.</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">4</span>
              <p><strong>Controle Total:</strong> Você pode editar ou solicitar a exclusão definitiva da sua conta a qualquer momento.</p>
            </li>
          </ul>
        </div>

        {/* Texto Completo */}
        <div className="border-t border-slate-100 pt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Eye className="text-slate-600" size={22} />
            Política de Privacidade Completa
          </h2>
          
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
            <Info className="mx-auto text-slate-400 mb-3 animate-pulse" size={36} />
            <h3 className="font-semibold text-slate-700 mb-2">Aguardando Política Completa</h3>
            <p className="text-sm text-slate-550 max-w-md mx-auto mb-4">
              Por favor, insira o texto completo da Política de Privacidade no arquivo <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800">privacidade-completa.txt</code> localizado na raiz do projeto, ou envie-o no chat para que eu o formate aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}