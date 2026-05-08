import { Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft } from 'lucide-react';

export default function Dicas() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lightbulb className="text-amber-500" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Dicas de Perfil</h1>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Estamos trabalhando em um sistema completo de <strong>troca de feedbacks e dicas</strong> para ajudar você a destacar seu perfil ainda mais. Em breve, você poderá interagir com outros profissionais e compartilhar conhecimento.
        </p>
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-2">Enquanto isso, a dica de ouro é:</h3>
          <p className="text-slate-600">
            Mantenha seu número de WhatsApp sempre atualizado e escreva uma descrição clara do seu serviço. Nossa IA faz o resto por você!
          </p>
        </div>
        <Link to="/search" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-hover transition-colors">
          <ArrowLeft size={16} /> Voltar para Explorar
        </Link>
      </div>
    </div>
  );
}
