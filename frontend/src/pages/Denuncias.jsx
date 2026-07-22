import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle, Send, Loader2, Flag } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const REPORT_REASONS = [
  {
    id: 'imagens_falsas',
    label: 'Imagens falsas',
    description: 'Imagens falsas, impressas ou impróprias no perfil ou portfólio.',
  },
  {
    id: 'suspeita_golpe',
    label: 'Suspeita de golpe',
    description: 'Cobrança de adiantamentos suspeitos ou desaparecimento pós-pagamento.',
  },
  {
    id: 'conduta_desrespeitosa',
    label: 'Conduta desrespeitosa',
    description: 'Linguagem ofensiva, assédio, ameaças ou maus-tratos.',
  },
  {
    id: 'atividade_criminosa',
    label: 'Atividade criminosa',
    description: 'Serviço que viola leis estaduais/federais ou atividades ilícitas.',
  },
  {
    id: 'outros',
    label: 'Outros',
    description: 'Descreva o problema no campo de detalhes adicionais.',
  },
];

export default function Denuncias() {
  const { user } = useContext(AuthContext);

  // Estados do Formulário Manual
  const [referenceCode, setReferenceCode] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!referenceCode.trim()) {
      setError('Por favor, informe o Código de Referência do Profissional (Ex: PRO-002).');
      return;
    }

    if (!selectedReason) {
      setError('Por favor, selecione o motivo da denúncia.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceCode: referenceCode.trim().toUpperCase(),
          reason: selectedReason,
          details: details.trim() || null,
          reporterUserId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao enviar a denúncia. Verifique o código de referência.');
      }

      setFormSuccess(true);
      setReferenceCode('');
      setSelectedReason('');
      setDetails('');
    } catch (err) {
      console.error('Erro no envio da denúncia:', err);
      setError(err.message || 'Ocorreu um erro ao enviar sua denúncia. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Card Informativo Principal */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          
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
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Denúncias</h1>
              <p className="text-sm text-slate-500 mt-1">Canal seguro para reportar abusos, irregularidades ou violações</p>
            </div>
          </div>

          {/* Conteúdo Explicativo */}
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <p className="text-base sm:text-lg text-slate-700 font-medium">
              Se você identificou algum perfil falso, anúncio inadequado ou comportamento que viole as diretrizes da comunidade, utilize este canal seguro.
            </p>

            {/* Como enviar uma denúncia */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Como enviar uma denúncia?</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Para denunciar um perfil diretamente, acesse a página do profissional e role até o final. Lá, você encontrará o 'Código de Referência' do anúncio e um link escrito 'Encontrou algo errado? Denunciar este perfil'. Ao clicar, um formulário seguro será aberto. Se preferir, você também pode usar o formulário fixo abaixo nesta página, informando o Código de Referência do profissional.
              </p>
            </div>

            {/* O que acontece após a denúncia */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
              <h2 className="text-xl font-bold text-slate-900">O que acontece após a denúncia?</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Todas as denúncias são enviadas diretamente para a nossa Central de Moderação e avaliadas por nossa equipe. O profissional denunciado poderá ser notificado para prestar esclarecimentos ou adequar o seu perfil. Dependendo da gravidade e da violação dos nossos Termos de Uso, o perfil pode sofrer suspensão temporária ou até mesmo a exclusão permanente da plataforma.
              </p>
            </div>
          </div>

        </div>

        {/* Formulário Fixo: Fazer uma Denúncia Manual */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Fazer uma Denúncia Manual</h2>
              <p className="text-xs sm:text-sm text-slate-500">Preencha o código do profissional e selecione o motivo da denúncia.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle size={18} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Sucesso */}
            {formSuccess ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in duration-300">
                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Denúncia Enviada para a Moderação!</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Sua denúncia foi registrada com sucesso. Nossa equipe de segurança irá analisar o caso e tomar as providências cabíveis.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSuccess(false)}
                  className="mt-3 text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
                >
                  Fazer outra denúncia manual
                </button>
              </div>
            ) : (
              <>
                {/* Campo 1: Código de Referência */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Código de Referência do Profissional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => {
                      setReferenceCode(e.target.value);
                      setError('');
                    }}
                    required
                    placeholder="Ex: PRO-002"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono uppercase placeholder:font-sans placeholder:normal-case"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Você encontra este código no final da página do anúncio do profissional.
                  </p>
                </div>

                {/* Campo 2: Radio Buttons para Motivo da Denúncia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Motivo da Denúncia <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2.5">
                    {REPORT_REASONS.map((item) => {
                      const isSelected = selectedReason === item.label;
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'border-red-500 bg-red-50/60'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="radio"
                            name="motivo"
                            value={item.label}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedReason(item.label);
                              setError('');
                            }}
                            className="sr-only"
                          />
                          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-red-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-red-800' : 'text-slate-800'}`}>
                              {item.label}
                            </span>
                            <span className={`text-xs block mt-0.5 ${isSelected ? 'text-red-600' : 'text-slate-500'}`}>
                              {item.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Campo 3: Detalhes Adicionais */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Detalhes Adicionais <span className="text-slate-400 font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    placeholder="Descreva mais detalhes sobre o ocorrido para ajudar na moderação..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm resize-none"
                  />
                </div>

                {/* Botão de Envio */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !referenceCode.trim() || !selectedReason}
                    className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                    Enviar Denúncia para Moderação
                  </button>
                </div>
              </>
            )}

          </form>

        </div>

      </div>
    </div>
  );
}
