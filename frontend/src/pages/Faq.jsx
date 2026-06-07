import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function Faq() {
  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-100 p-8 sm:p-12">
        {/* Botão Voltar */}
        <div className="mb-8">
          <Link
            to="/central-de-ajuda"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Central de Ajuda
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Dúvidas Frequentes</h1>
            <p className="text-sm text-slate-550 mt-1">Perguntas comuns e respostas sobre a plataforma</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p className="text-lg text-slate-700 font-medium">
            Encontre respostas rápidas para as perguntas mais comuns dos usuários e profissionais do proITA.
          </p>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-slate-800">Como funciona o cadastro?</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-slate-800">Quais são os planos disponíveis?</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
