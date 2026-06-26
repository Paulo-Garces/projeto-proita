import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, MessageCircle, Heart, QrCode, Edit2, Trash2, ExternalLink } from 'lucide-react';

export default function DashboardAdCard({ 
  professional, 
  disableEdit = false, 
  onEdit, 
  onDelete, 
  onOpenQrCode 
}) {
  const displayName = professional.name || 'Profissional';
  const categoryName = professional.category || 'Categoria';
  const avatarUrl = professional.avatar || null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full hover:border-slate-300">
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0284c7&textColor=ffffff`;
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl border border-sky-100">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate" title={displayName}>
            {displayName}
          </h3>
          <p className="text-primary font-bold text-xs uppercase tracking-wider mt-1">
            {categoryName}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              disableEdit 
                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${disableEdit ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              {disableEdit ? 'Suspenso' : 'Ativo'}
            </span>
          </div>
        </div>
      </div>

      {/* Resumo das Estatísticas */}
      <div className="grid grid-cols-3 gap-2.5 my-5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100/80">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
            <Eye size={13} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visitas</span>
          </div>
          <span className="font-extrabold text-slate-800 text-sm leading-none block mt-1">
            {professional.profileViews ?? 0}
          </span>
        </div>
        <div className="text-center border-x border-slate-200/60">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
            <MessageCircle size={13} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cliques</span>
          </div>
          <span className="font-extrabold text-slate-800 text-sm leading-none block mt-1">
            {professional.whatsappClicks ?? 0}
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
            <Heart size={13} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amei</span>
          </div>
          <span className="font-extrabold text-slate-800 text-sm leading-none block mt-1">
            {professional.favoritesCount ?? 0}
          </span>
        </div>
      </div>

      {/* Ações Administrativas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-auto">
        <Link
          to={`/profile/${professional.slug || professional.id}`}
          className="inline-flex items-center justify-center gap-1 text-slate-500 hover:text-primary font-bold text-xs transition-colors py-2 px-3 hover:bg-slate-50 rounded-xl cursor-pointer"
        >
          Ver Perfil Público <ExternalLink size={13} />
        </Link>
        
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Botão QR Code */}
          <button
            onClick={onOpenQrCode}
            type="button"
            title="Divulgar QR Code"
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-350 transition-all active:scale-95 cursor-pointer"
          >
            <QrCode size={16} />
          </button>
          
          {/* Botão Editar */}
          <button
            onClick={onEdit}
            type="button"
            disabled={disableEdit}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              disableEdit 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/10'
            }`}
          >
            <Edit2 size={13} /> Editar
          </button>
          
          {/* Botão Excluir */}
          <button
            onClick={onDelete}
            type="button"
            title="Excluir Anúncio"
            className="flex items-center justify-center p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
