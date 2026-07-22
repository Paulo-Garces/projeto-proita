import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, ExternalLink } from 'lucide-react';

export default function TermsAndPrivacy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
        
        {/* Botão Voltar */}
        <div className="mb-8">
          <Link
            to="/central-de-ajuda"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Central de Ajuda
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Termos e Privacidade</h1>
            <p className="text-sm text-slate-500 mt-1">Resumo das diretrizes de segurança e termos da plataforma</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <p className="text-base sm:text-lg text-slate-700 font-medium">
            Bem-vindo aos Termos de Uso e Política de Privacidade do proITA. Esta página reúne as diretrizes e regras de privacidade do nosso portal para o uso seguro de nossa plataforma.
          </p>

          {/* 1. Termos de Serviço */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-slate-900">1. Termos de Serviço</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              O proITA atua como uma vitrine virtual, conectando clientes e profissionais em Itapipoca. Não nos responsabilizamos pelas negociações ou qualidade do serviço final, que ocorrem diretamente entre as partes. É proibido o uso da plataforma para atividades ilícitas.
            </p>
          </div>

          {/* 2. Política de Privacidade */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">2. Política de Privacidade</h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Seus dados estão seguros conosco. Coletamos apenas as informações necessárias para o funcionamento do seu perfil e para facilitar o contato dos clientes. Jamais vendemos suas informações para terceiros.
            </p>
          </div>

          {/* Botão de Documento Completo */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <Link
              to="/termos"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Ler documento completo</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
