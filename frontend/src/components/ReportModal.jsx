import { useState, useEffect, useContext } from 'react';
import { X, Flag, AlertTriangle, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

// ── Opções de motivo da denúncia ──────────────────────────────────────────────
const REPORT_REASONS = [
  {
    id: 'imagens_falsas',
    label: 'Imagens falsas ou impróprias',
    icon: '🖼️',
    description: 'Foto de perfil ou portfólio que não pertence ao profissional, ou conteúdo inadequado.',
  },
  {
    id: 'golpe_fraude',
    label: 'Suspeita de golpe ou fraude',
    icon: '⚠️',
    description: 'Profissional cobra adiantamentos, some após receber pagamento ou se passa por outro.',
  },
  {
    id: 'conduta_abusiva',
    label: 'Conduta desrespeitosa ou abusiva',
    icon: '🚫',
    description: 'Linguagem ofensiva, assédio, ameaças ou comportamento inadequado.',
  },
  {
    id: 'atividade_criminosa',
    label: 'Atividade criminosa ou ilegal',
    icon: '🔒',
    description: 'Serviço que viola leis ou envolve atividades criminosas.',
  },
  {
    id: 'outros',
    label: 'Outros',
    icon: '💬',
    description: 'Descreva o problema no campo de detalhes abaixo.',
  },
];

// ── Toast de confirmação inline ───────────────────────────────────────────────
function SuccessToast({ onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 max-w-sm">
        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={18} />
        </div>
        <div>
          <p className="font-bold text-sm">Denúncia enviada!</p>
          <p className="text-xs text-slate-400 mt-0.5">Nossa equipe irá analisar em breve.</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function ReportModal({ isOpen, onClose, adId, adName, referenceCode }) {
  const { user } = useContext(AuthContext);

  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isOthers = selectedReason === 'Outros';
  const detailsRequired = isOthers && !details.trim();

  // Reset ao abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedReason('');
        setDetails('');
        setError('');
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedReason) {
      setError('Por favor, selecione um motivo para a denúncia.');
      return;
    }
    if (isOthers && !details.trim()) {
      setError('Por favor, descreva o motivo no campo de detalhes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          reason: selectedReason,
          details: details.trim() || null,
          reporterUserId: user?.id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro ao enviar a denúncia.');
      }

      // Sucesso: fecha modal e exibe toast
      onClose();
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !showSuccessToast) return null;

  return (
    <>
      {/* ── Toast de Sucesso (fora do modal) ── */}
      {showSuccessToast && (
        <SuccessToast onClose={() => setShowSuccessToast(false)} />
      )}

      {/* ── Overlay + Modal ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            style={{ animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >

            {/* ── Cabeçalho ── */}
            <div className="relative bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5 text-white">
              {/* Círculo decorativo */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-4 w-20 h-20 bg-white/5 rounded-full" />

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg leading-tight">Denunciar Profissional</h2>
                    {referenceCode ? (
                      <p className="text-red-200 text-xs mt-0.5 font-mono tracking-wider">
                        Referência: <span className="text-white font-bold">{referenceCode}</span>
                        {adName && <span className="text-red-200/80 font-sans not-italic"> · {adName}</span>}
                      </p>
                    ) : (
                      adName && <p className="text-red-200 text-xs mt-0.5">{adName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Aviso de uso correto */}
              <div className="relative mt-4 flex items-start gap-2 bg-white/15 rounded-xl px-3.5 py-2.5 text-xs text-red-100">
                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-yellow-300" />
                <span>Suas informações ajudam a manter a plataforma segura. Denúncias falsas podem resultar em banimento.</span>
              </div>
            </div>

            {/* ── Formulário ── */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* Erro global */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in duration-200">
                  <AlertTriangle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Radio Buttons Modernos ── */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Motivo da denúncia <span className="text-red-500">*</span>
                </p>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.label;
                    return (
                      <label
                        key={reason.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 group ${
                          isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.label}
                          checked={isSelected}
                          onChange={() => {
                            setSelectedReason(reason.label);
                            setError('');
                          }}
                          className="sr-only"
                        />
                        {/* Custom radio circle */}
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-red-500' : 'border-slate-300 group-hover:border-slate-400'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold leading-snug ${
                            isSelected ? 'text-red-700' : 'text-slate-700'
                          }`}>
                            <span className="mr-1.5">{reason.icon}</span>
                            {reason.label}
                          </span>
                          <p className={`text-xs mt-0.5 leading-relaxed ${
                            isSelected ? 'text-red-500' : 'text-slate-400'
                          }`}>
                            {reason.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* ── Textarea de Detalhes ── */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Detalhes adicionais
                  {isOthers && <span className="text-red-500 ml-1">*</span>}
                  {!isOthers && <span className="text-slate-400 font-normal normal-case ml-1">(opcional)</span>}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => { setDetails(e.target.value); setError(''); }}
                  placeholder="Descreva com mais detalhes o que aconteceu (opcional)..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-2xl border text-sm text-slate-700 resize-none transition-all outline-none placeholder:text-slate-400 focus:ring-2 ${
                    isOthers && !details.trim()
                      ? 'border-red-300 bg-red-50/50 focus:ring-red-300 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white'
                  }`}
                />
                {isOthers && !details.trim() && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    Obrigatório quando "Outros" está selecionado.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {details.length}/500 caracteres
                </p>
              </div>

            </form>

            {/* ── Rodapé com Ações ── */}
            <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="report-form"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason || detailsRequired}
                className="flex-[1.5] py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Flag size={15} />
                    Enviar Denúncia
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Animação do modal ── */}
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}
