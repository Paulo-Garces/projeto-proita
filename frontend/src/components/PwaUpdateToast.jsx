import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Register Error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full bg-white border border-slate-100 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
          <RefreshCw className="animate-spin duration-1000" size={20} style={{ animationDuration: '3s' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-bold text-slate-800 text-sm mb-1">
              Atualização Disponível
            </h4>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Uma nova versão do proITA acabou de chegar! Atualize para aproveitar as últimas novidades.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
            >
              Atualizar Agora
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Mais Tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
