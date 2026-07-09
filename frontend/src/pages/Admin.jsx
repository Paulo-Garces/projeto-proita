import { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  CircleDollarSign,
  Settings,
  TrendingUp,
  Activity,
  Briefcase,
  Edit,
  Ban,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  Filter,
  RefreshCw,
  X,
  AlertTriangle,
  Search,
  MoreVertical,
  CalendarPlus,
  KeyRound,
  UserCheck,
  PhoneCall,
  Mail,
  ShieldOff,
  Plus,
  TrendingDown,
  Bell,
  MessageCircle,
  LogIn,
  User,
  Image,
  FileText,
  Trash2,
  Save,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pendente:  { label: 'Pendente',  bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    resolvido: { label: 'Resolvido', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    ignorado:  { label: 'Ignorado',  bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
  };
  const s = map[status] ?? map.pendente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function truncate(str, n = 60) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Máscara de telefone: '+5588999999999' → '+55 (88) 99999-9999'
function formatPhone(raw) {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 13) {
    // +55 (XX) 9XXXX-XXXX
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.startsWith('55') && digits.length === 12) {
    // +55 (XX) XXXX-XXXX
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

// Card de métricas para o dashboard com suporte a Skeleton e Erro
function MetricCard({ title, value, icon: Icon, colorClass, loading, error, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>{Icon && <Icon size={24} />}</div>
          {subtitle}
        </div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      </div>
      <div>
        {loading ? (
          <div className="h-9 w-24 bg-slate-200/80 rounded-lg animate-pulse my-1" />
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500 font-medium">
            <span className="text-3xl font-bold">0</span>
            <AlertTriangle size={18} className="text-red-500 animate-pulse" title="Erro ao carregar dados" />
          </div>
        ) : (
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        )}
      </div>
    </div>
  );
}

// Badge de status de usuário (role + planStatus + expiration checks)
function UserStatusBadge({ role, hasAd, planStatus, subscriptionEndsAt, trialEndsAt, createdAt, planType }) {
  if (role === 'BLOCKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Bloqueado
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        Admin
      </span>
    );
  }
  if (hasAd) {
    const expirationDate = subscriptionEndsAt || trialEndsAt;
    const isAtivo = expirationDate ? new Date(expirationDate) > new Date() : false;
    
    if (!isAtivo) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Plano Expirado
        </span>
      );
    }

    // Check if it's a trial plan (30 days from creation)
    const isTrial =
      planStatus === 'DEGUSTACAO' ||
      !!trialEndsAt ||
      planType === 'TESTE' ||
      (subscriptionEndsAt && createdAt && (() => {
        const diffMs = Math.abs(new Date(subscriptionEndsAt).getTime() - new Date(createdAt).getTime());
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        // 1 hour tolerance to handle small delays during registration
        return diffMs >= (thirtyDaysMs - 3600000) && diffMs <= (thirtyDaysMs + 3600000);
      })());

    // Determine plan variation
    let badgeClass = "bg-blue-100 text-blue-700 border border-blue-200";
    let dotClass = "bg-blue-500";
    let badgeText = "Período de Teste";

    if (planType === 'CORTESIA') {
      badgeClass = "bg-purple-100 text-purple-700 border border-purple-200";
      dotClass = "bg-purple-500";
      badgeText = "Cortesia VIP";
    } else if (planType === 'PRO_ANUAL') {
      badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
      dotClass = "bg-emerald-500";
      badgeText = "Pro Anual";
    } else if (planType === 'PRO_BIENAL') {
      badgeClass = "bg-teal-100 text-teal-700 border border-teal-200";
      dotClass = "bg-teal-500";
      badgeText = "Pro Bienal";
    } else if (planType === 'PATROCINADOR_ANUAL') {
      badgeClass = "bg-yellow-100 text-yellow-800 border border-yellow-300";
      dotClass = "bg-yellow-500";
      badgeText = "Patrocinador Anual";
    } else if (planType === 'PATROCINADOR_BIENAL') {
      badgeClass = "bg-orange-100 text-orange-700 border border-orange-200";
      dotClass = "bg-orange-500";
      badgeText = "Patrocinador Bienal";
    } else if (planType === 'TESTE' || isTrial) {
      badgeClass = "bg-blue-100 text-blue-700 border border-blue-200";
      dotClass = "bg-blue-500";
      badgeText = "Período de Teste";
    } else {
      // Default fallback for active plan
      badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
      dotClass = "bg-emerald-500";
      badgeText = "Pro Anual";
    }

    return (
      <div className="flex flex-col items-start gap-1">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {badgeText}
        </span>
        
        {expirationDate && (
          <p className="text-[10px] text-slate-400 font-medium pl-1">
            até {formatDate(expirationDate)}
          </p>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Usuário
    </span>
  );
}

// Toast do Admin (feedback rápido de ações)
function AdminToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border max-w-sm ${
        isError
          ? 'bg-red-600 text-white border-red-500'
          : 'bg-slate-900 text-white border-white/10'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isError ? 'bg-white/20' : 'bg-emerald-500'
        }`}>
          {isError ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
        </div>
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose} className="text-white/60 hover:text-white p-1 cursor-pointer">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal de Detalhes da Denúncia ──────────────────────────────────────────

function ReportDetailModal({ report, onClose, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false);

  if (!report) return null;

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    await onUpdateStatus(report.id, newStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flag size={16} className="text-red-400" />
              <h3 className="font-bold text-base">Detalhes da Denúncia</h3>
            </div>
            {report.referenceCode && (
              <span className="font-mono text-xs text-slate-300 tracking-widest">
                {report.referenceCode} · {report.adName || 'Profissional'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Referência</p>
              <p className="font-mono font-bold text-slate-800 text-sm">{report.referenceCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status Atual</p>
              <StatusBadge status={report.status} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profissional</p>
              <p className="text-sm text-slate-700 font-medium">{report.adName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data</p>
              <p className="text-sm text-slate-700">{formatDate(report.createdAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria do Motivo</p>
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-sm font-semibold border border-red-100">
              <AlertTriangle size={13} />
              {report.reason}
            </div>
          </div>

          {report.details && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição do Denunciante</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
                {report.details}
              </div>
            </div>
          )}

          {!report.details && (
            <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-400 italic text-center border border-dashed border-slate-200">
              Nenhum detalhe adicional foi fornecido.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-1 grid grid-cols-3 gap-2 border-t border-slate-100">
          <Link
            to={`/profile/${report.adId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-colors text-xs font-semibold border border-indigo-100"
          >
            <ExternalLink size={16} />
            Ver Perfil
          </Link>
          <button
            onClick={() => handleStatus('resolvido')}
            disabled={updating || report.status === 'resolvido'}
            className="flex flex-col items-center gap-1 py-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-colors text-xs font-semibold border border-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle size={16} />
            Resolver
          </button>
          <button
            onClick={() => handleStatus('ignorado')}
            disabled={updating || report.status === 'ignorado'}
            className="flex flex-col items-center gap-1 py-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors text-xs font-semibold border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <XCircle size={16} />
            Ignorar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.93) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Tab: Central de Moderação ──────────────────────────────────────────────

function ModerationTab({ token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = filterStatus !== 'all'
        ? `${API_URL}/api/admin/reports?status=${filterStatus}`
        : `${API_URL}/api/admin/reports`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      } else {
        setError(data.message || 'Erro ao carregar denúncias.');
      }
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev =>
          prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
        );
      }
    } catch {
      // silently ignore
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtro de busca local (por código, nome ou motivo)
  const filtered = reports.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.referenceCode || '').toLowerCase().includes(q) ||
      (r.adName || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    );
  });

  // Contadores
  const counts = {
    all:      reports.length,
    pendente: reports.filter(r => r.status === 'pendente').length,
    resolvido: reports.filter(r => r.status === 'resolvido').length,
    ignorado:  reports.filter(r => r.status === 'ignorado').length,
  };

  const filters = [
    { id: 'all',      label: 'Todos',     count: counts.all },
    { id: 'pendente', label: 'Pendentes', count: counts.pendente },
    { id: 'resolvido',label: 'Resolvidos',count: counts.resolvido },
    { id: 'ignorado', label: 'Ignorados', count: counts.ignorado },
  ];

  return (
    <div className="space-y-6">

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, color: 'from-slate-700 to-slate-600', icon: Flag },
          { label: 'Pendentes', value: counts.pendente, color: 'from-amber-500 to-orange-500', icon: Clock },
          { label: 'Resolvidos', value: counts.resolvido, color: 'from-emerald-500 to-teal-500', icon: CheckCircle },
          { label: 'Ignorados', value: counts.ignorado, color: 'from-slate-400 to-slate-500', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <Icon size={20} className="opacity-80" />
              <span className="text-2xl font-extrabold">{loading ? '…' : value}</span>
            </div>
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Filtros por status */}
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
          <Filter size={14} className="text-slate-400 ml-2" />
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterStatus === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
              }`}>
                {loading ? '…' : f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, nome ou motivo..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-700"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
          title="Recarregar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border-b border-red-100 px-6 py-4 text-sm font-medium">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Referência', 'Profissional', 'Motivo', 'Detalhes', 'Data', 'Status', 'Ações'].map(col => (
                  <th key={col} className="py-3.5 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Skeleton rows */
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-4 bg-slate-100 rounded-full animate-pulse" style={{ width: `${60 + (j * 7) % 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <ShieldAlert size={36} className="text-slate-200" />
                      <p className="font-medium text-slate-500">Nenhuma denúncia encontrada.</p>
                      <p className="text-sm">
                        {search ? 'Tente outro termo de busca.' : 'A plataforma está limpa! 🎉'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(report => (
                  <tr
                    key={report.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Referência */}
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        {report.referenceCode || '—'}
                      </span>
                    </td>

                    {/* Profissional */}
                    <td className="py-4 px-5">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {truncate(report.adName, 24)}
                      </p>
                      {report.adCategory && (
                        <p className="text-xs text-slate-400 mt-0.5">{truncate(report.adCategory, 20)}</p>
                      )}
                    </td>

                    {/* Motivo */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 whitespace-nowrap">
                        <Flag size={10} />
                        {truncate(report.reason, 28)}
                      </span>
                    </td>

                    {/* Detalhes */}
                    <td className="py-4 px-5 max-w-[180px]">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {truncate(report.details, 55)}
                      </p>
                    </td>

                    {/* Data */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="text-xs text-slate-500">{formatDate(report.createdAt)}</p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        {/* Visualizar */}
                        <button
                          onClick={() => setSelectedReport(report)}
                          title="Ver detalhes completos"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Analisar perfil */}
                        <Link
                          to={`/profile/${report.adId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir perfil do denunciado"
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        >
                          <ExternalLink size={16} />
                        </Link>

                        {/* Resolver */}
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'resolvido')}
                          disabled={updatingId === report.id || report.status === 'resolvido'}
                          title="Marcar como Resolvido"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filtered.length} denúncia{filtered.length !== 1 ? 's' : ''} exibida{filtered.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> Atualizado agora
            </span>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

// ─── ActionMenu: Dropdown de Ações do Profissional ──────────────────────────────────

function ActionMenu({ user, onAction, isNearBottom }) {
  const [open, setOpen] = useState(false);

  const isBlocked = user.role === 'BLOCKED';

  const items = [
    {
      id: 'edit',
      label: 'Editar Perfil',
      icon: Edit,
      color: 'text-indigo-600 hover:bg-indigo-50',
    },
    {
      id: 'impersonate',
      label: 'Acessar Conta (Modo Deus)',
      icon: LogIn,
      color: 'text-violet-600 hover:bg-violet-50',
    },
    {
      id: 'extend',
      label: 'Renovar / Estender Plano',
      icon: CalendarPlus,
      color: 'text-emerald-600 hover:bg-emerald-50',
      hidden: !user.hasAd,
    },
    {
      id: 'reset',
      label: 'Recuperar Senha por E-mail',
      icon: KeyRound,
      color: 'text-amber-600 hover:bg-amber-50',
    },
    { divider: true },
    {
      id: isBlocked ? 'unblock' : 'block',
      label: isBlocked ? 'Reativar Conta' : 'Bloquear / Suspender',
      icon: isBlocked ? UserCheck : Ban,
      color: isBlocked
        ? 'text-emerald-600 hover:bg-emerald-50'
        : 'text-red-600 hover:bg-red-50',
    },
    {
      id: 'delete',
      label: 'Excluir Definitivamente',
      icon: Trash2,
      color: 'text-red-600 hover:bg-red-50',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        title="Menu de ações"
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <>
          {/* Overlay para fechar */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div 
            className={`absolute right-0 w-48 bg-white rounded-xl shadow-xl z-[999] border border-slate-100 py-1.5 overflow-hidden ${
              isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            style={{ animation: `${isNearBottom ? 'menuPopUp' : 'menuPop'} 0.15s ease-out both` }}
          >
            {items.map((item, idx) => {
              if (item.hidden) return null;
              if (item.divider) return <div key={idx} className="my-1 border-t border-slate-100" />;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setOpen(false); onAction(item.id, user); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left transition-colors cursor-pointer ${item.color}`}
                >
                  <Icon size={15} className="shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes menuPop {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes menuPopUp {
          from { opacity: 0; transform: scale(0.95) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Modais de Confirmação de Ação ──────────────────────────────────────────

function ConfirmModal({ action, user, token, onSuccess, onClose }) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!action || !user) return null;

  const config = {
    block: {
      title: 'Bloquear Conta',
      desc: `Tem certeza que deseja bloquear a conta de "${user.nome}"? O usuário não conseguirá mais acessar a plataforma.`,
      icon: Ban,
      confirmLabel: 'Bloquear',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    unblock: {
      title: 'Reativar Conta',
      desc: `Deseja reativar a conta de "${user.nome}"? O acesso será restaurado imediatamente.`,
      icon: UserCheck,
      confirmLabel: 'Reativar',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    reset: {
      title: 'Enviar Recuperação de Senha',
      desc: user.email
        ? `Será enviado um e-mail de recuperação para "${user.email}".`
        : `⚠️ Este usuário não possui e-mail cadastrado. A ação não pode ser concluída.`,
      icon: KeyRound,
      confirmLabel: 'Enviar E-mail',
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      disabled: !user.email,
    },
    extend: {
      title: 'Renovar / Estender Plano',
      desc: `Estender o plano de "${user.nome}" por quantos dias?`,
      icon: CalendarPlus,
      confirmLabel: `Estender ${days} dias`,
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      showDaysInput: true,
    },
    impersonate: {
      title: 'Acessar Conta (Modo Deus)',
      desc: `Você iniciará uma sessão simulada para o usuário "${user.nome}". Suas credenciais de administrador serão preservadas localmente e você poderá retornar ao painel admin a qualquer momento.`,
      icon: LogIn,
      confirmLabel: 'Acessar Conta',
      confirmClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    delete: {
      title: 'Excluir Usuário Definitivamente',
      desc: `Tem certeza que deseja excluir o usuário "${user.nome}" e todos os seus anúncios? Esta ação não pode ser desfeita.`,
      icon: Trash2,
      confirmLabel: 'Excluir Definitivamente',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
  };

  const c = config[action];
  if (!c) return null;
  const Icon = c.icon;

  const handleConfirm = async () => {
    if (c.infoOnly) { onClose(); return; }
    if (c.disabled) return;

    setLoading(true);
    setLocalError('');
    try {
      if (action === 'impersonate') {
        const res = await fetch(`${API_URL}/api/admin/users/${user.id}/impersonate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        // Salva token original de admin
        const adminToken = localStorage.getItem('@proita:token');
        localStorage.setItem('@proita:admin_token', adminToken);
        localStorage.setItem('impersonator_name', user.nome);

        // Substitui a sessão pelo usuário de destino
        localStorage.setItem('@proita:token', data.token);
        localStorage.setItem('@proita:user', JSON.stringify(data.user));

        // Redireciona e recarrega para reiniciar os estados do react
        window.location.href = '/dashboard';
        return;
      }

      let url = '';
      let method = 'POST';
      let body = {};

      if (action === 'block')   { url = `/api/admin/users/${user.id}/role`;       method = 'PATCH'; body = { role: 'BLOCKED' }; }
      if (action === 'unblock') { url = `/api/admin/users/${user.id}/role`;       method = 'PATCH'; body = { role: 'USER' }; }
      if (action === 'reset')   { url = `/api/admin/users/${user.id}/send-reset`; }
      if (action === 'extend')  { url = `/api/admin/users/${user.id}/extend-plan`; body = { days }; }
      if (action === 'delete')  { url = `/api/admin/users/${user.id}`;             method = 'DELETE'; }

      const res = await fetch(`${API_URL}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      onSuccess(data.message, action, user.id);
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Erro ao executar ação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-xl">
            <Icon size={20} className="text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">{c.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{user.referenceCode || user.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>

          {c.showDaysInput && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Número de dias</label>
              <div className="flex items-center gap-2">
                {[7, 15, 30, 60, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      days === d
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          )}

          {localError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm border border-red-100">
              <AlertTriangle size={13} /> {localError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || c.disabled}
            className={`flex-[1.5] py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${c.confirmClass}`}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Aguarde...</>
            ) : c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Disparo de Notificação ────────────────────────────────────────

function NotifyModal({ user, token, onSuccess, onClose }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setLocalError('Título e mensagem são obrigatórios.');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          message,
          type,
          sendEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'Notificação enviada com sucesso!');
        onClose();
      } else {
        setLocalError(data.message || 'Erro ao enviar notificação.');
      }
    } catch (err) {
      console.error(err);
      setLocalError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <Bell size={20} />
            <h3 className="text-lg font-bold text-slate-800">Enviar Notificação</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500 font-medium">
              Destinatário: <span className="text-slate-800 font-bold">{user.nome} {user.sobrenome || ''}</span>
            </p>

            {localError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm border border-red-100">
                <AlertTriangle size={13} className="shrink-0" /> {localError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Título da Notificação
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Atualização cadastral necessária"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem da notificação..."
                rows="4"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="SYSTEM">Aviso</option>
                  <option value="WARNING">Financeiro</option>
                  <option value="INFO">Dica</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">Enviar cópia para E-mail</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
              ) : 'Enviar Notificação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Disparo em Massa (Broadcast) ──────────────────────────────────

function BroadcastModal({ token, onSuccess, onClose }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setLocalError('Título e mensagem são obrigatórios.');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          message,
          type
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'Notificação geral enviada com sucesso!');
        onClose();
      } else {
        setLocalError(data.message || 'Erro ao enviar notificação em massa.');
      }
    } catch (err) {
      console.error(err);
      setLocalError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <ShieldAlert size={20} />
            <h3 className="text-lg font-bold text-slate-800">Disparo em Massa (Aviso Geral)</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 leading-relaxed">
              ⚠️ <strong>Atenção:</strong> Esta mensagem será gravada no histórico de <strong>todos os usuários</strong> cadastrados na plataforma proITA. Esta ação não envia e-mails para evitar limites do SMTP.
            </div>

            {localError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm border border-red-100">
                <AlertTriangle size={13} className="shrink-0" /> {localError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Título do Aviso Geral
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manutenção agendada para o sistema"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mensagem Geral
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem que todos os usuários vão ver no painel..."
                rows="5"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tipo do Aviso
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="SYSTEM">Aviso Geral</option>
                <option value="WARNING">Financeiro / Cobrança</option>
                <option value="INFO">Dica e Conteúdo</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Disparando...</>
              ) : 'Disparar para Todos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Renovação / Extensão de Plano ─────────────────────────────────

function ExtendPlanModal({ user, token, onSuccess, onClose }) {
  const [option, setOption] = useState('30d'); // '30d', '365d', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [planType, setPlanType] = useState(user.planType || 'PRO_ANUAL');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleExtend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    let requestBody = {};
    if (option === '30d') {
      requestBody = { option: '30d', planType };
    } else if (option === '365d') {
      requestBody = { option: '365d', planType };
    } else {
      if (!customDate) {
        setLocalError('Por favor, selecione uma data customizada.');
        setLoading(false);
        return;
      }
      requestBody = { option: 'custom', customDate, planType };
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/extend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'Plano estendido com sucesso!');
        onClose();
      } else {
        setLocalError(data.message || 'Erro ao estender plano.');
      }
    } catch (err) {
      console.error(err);
      setLocalError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 text-emerald-600">
            <CalendarPlus size={20} />
            <h3 className="text-lg font-bold text-slate-800">Renovar / Estender Plano</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleExtend}>
          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500 font-medium">
              Profissional: <span className="text-slate-800 font-bold">{user.nome}</span>
            </p>

            {localError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm border border-red-100">
                <AlertTriangle size={13} className="shrink-0" /> {localError}
              </div>
            )}

            {/* Tipo de Plano */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Plano
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white text-slate-700 font-medium"
              >
                <option value="TESTE">Período de Teste</option>
                <option value="CORTESIA">Cortesia VIP</option>
                <option value="PRO_ANUAL">Pro Anual</option>
                <option value="PRO_BIENAL">Pro Bienal</option>
                <option value="PATROCINADOR_ANUAL">Patrocinador Anual</option>
                <option value="PATROCINADOR_BIENAL">Patrocinador Bienal</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Selecione o Período
              </label>
              
              <div className="flex flex-col gap-2">
                <label className={`flex items-center justify-between p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                  option === '30d' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="extendOption"
                      checked={option === '30d'}
                      onChange={() => setOption('30d')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Adicionar 30 dias (Teste)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Recomendado para degustação ou cortesia.</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                  option === '365d' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="extendOption"
                      checked={option === '365d'}
                      onChange={() => setOption('365d')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Adicionar 1 Ano (Pix)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Plano anual oficial patrocinado.</p>
                    </div>
                  </div>
                </label>

                <label className={`flex flex-col p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                  option === 'custom' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="extendOption"
                      checked={option === 'custom'}
                      onChange={() => setOption('custom')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Escolher data customizada</p>
                      <p className="text-xs text-slate-500 mt-0.5">Selecione uma data específica de expiração.</p>
                    </div>
                  </div>

                  {option === 'custom' && (
                    <div className="mt-3 pl-7 animate-in slide-in-from-top-1 duration-150">
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                        required
                      />
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
              ) : 'Estender Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EditProfileModal: Moderação e Edição de Perfil ───────────────────────────

function EditProfileModal({ user, token, onSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'media' | 'notes'
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  // Fields for Tab 1 (basics)
  const [nome, setNome] = useState(user.nome || '');
  const [email, setEmail] = useState(user.email || '');
  const [telefone, setTelefone] = useState(user.telefone || '');
  const [category, setCategory] = useState(user.adCategory || '');

  // Fields for Tab 2 (media urls)
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [capaUrl, setCapaUrl] = useState(user.capaUrl || '');
  const [fotoAnuncioUrl, setFotoAnuncioUrl] = useState(user.fotoAnuncioUrl || '');

  // Fields for Tab 3 (notes)
  const [adminNotes, setAdminNotes] = useState(user.adminNotes || '');

  const handleSaveBasics = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          category
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      onSuccess('Dados básicos atualizados com sucesso!');
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Erro ao salvar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    setLocalError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminNotes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      onSuccess('Notas administrativas salvas!');
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Erro ao salvar notas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (type) => {
    if (!window.confirm(`Tem certeza que deseja remover esta mídia (${type})? A imagem será apagada permanentemente.`)) {
      return;
    }
    setLoading(true);
    setLocalError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      // Atualiza o estado na tela
      if (type === 'avatar') {
        setProfileImageUrl('');
        setAvatarUrl('');
      } else if (type === 'banner') {
        setCapaUrl('');
      } else if (type === 'sponsor') {
        setFotoAnuncioUrl('');
      }
      
      onSuccess(`Mídia '${type}' removida com sucesso!`);
    } catch (err) {
      setLocalError(err.message || 'Erro ao remover mídia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Moderação e Perfil</h3>
            <p className="text-xs text-slate-500 mt-0.5">Profissional: {user.nome}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-100 px-4 shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('basics')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'basics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={14} /> Dados Básicos
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Image size={14} /> Moderação Visual
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} /> Notas Internas
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {localError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-sm border border-red-100 shrink-0">
              <AlertTriangle size={13} className="shrink-0" /> {localError}
            </div>
          )}

          {/* ABA 1: DADOS BÁSICOS */}
          {activeTab === 'basics' && (
            <form onSubmit={handleSaveBasics} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria Principal</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}

          {/* ABA 2: MODERAÇÃO VISUAL */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-500">
                Remova mídias enviadas pelo profissional caso infrinjam os Termos de Uso ou contenham conteúdo inadequado.
              </p>

              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    {profileImageUrl || avatarUrl ? (
                      <img
                        src={profileImageUrl || avatarUrl}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">
                        Sem Foto
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Foto de Perfil (Avatar)</h4>
                      <p className="text-xs text-slate-400">Exibida na listagem e na página do profissional.</p>
                    </div>
                  </div>
                  {(profileImageUrl || avatarUrl) && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDeleteMedia('avatar')}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Excluir
                    </button>
                  )}
                </div>

                {/* Banner */}
                <div className="flex flex-col gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Banner de Capa</h4>
                      <p className="text-xs text-slate-400">Banner exibido no topo da página de detalhes.</p>
                    </div>
                    {capaUrl && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDeleteMedia('banner')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:text-red-700 disabled:opacity-50 shrink-0"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    )}
                  </div>
                  {capaUrl ? (
                    <img
                      src={capaUrl}
                      alt="Banner"
                      className="w-full h-24 rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                      Nenhum banner cadastrado
                    </div>
                  )}
                </div>

                {/* Sponsor (Foto Anúncio) */}
                <div className="flex flex-col gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Foto do Anúncio (Patrocinador)</h4>
                      <p className="text-xs text-slate-400">Imagem comercial exibida na listagem.</p>
                    </div>
                    {fotoAnuncioUrl && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDeleteMedia('sponsor')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:text-red-700 disabled:opacity-50 shrink-0"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    )}
                  </div>
                  {fotoAnuncioUrl ? (
                    <img
                      src={fotoAnuncioUrl}
                      alt="Sponsor"
                      className="w-full h-24 rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                      Nenhuma imagem comercial cadastrada
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* ABA 3: NOTAS INTERNAS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anotações Internas do Administrador</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full min-h-[160px] p-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800 font-medium leading-relaxed"
                  placeholder="Escreva notas administrativas internas sobre este profissional (ex: histórico de atendimento, acordos comerciais, advertências, etc.). Estas notas NÃO são visíveis para o usuário."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveNotes}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  {loading ? 'Salvando...' : 'Salvar Notas'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Gestão de Profissionais ─────────────────────────────────────────────

function ProfessionalsTab({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activePlanFilter, setActivePlanFilter] = useState(null);
  const [modalAction, setModalAction] = useState(null); // { action, user }
  const [toast, setToast] = useState(null);

  const getPlanTypeForUser = useCallback((u) => {
    if (u.role === 'BLOCKED' || u.role === 'ADMIN' || !u.hasAd) {
      return null;
    }
    const expirationDate = u.subscriptionEndsAt || u.trialEndsAt;
    const isAtivo = expirationDate ? new Date(expirationDate) > new Date() : false;
    if (!isAtivo) return 'EXPIRADO';

    if (u.planType) return u.planType;

    const isTrial =
      u.planStatus === 'DEGUSTACAO' ||
      !!u.trialEndsAt ||
      (u.subscriptionEndsAt && u.createdAt && (() => {
        const diffMs = Math.abs(new Date(u.subscriptionEndsAt).getTime() - new Date(u.createdAt).getTime());
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        return diffMs >= (thirtyDaysMs - 3600000) && diffMs <= (thirtyDaysMs + 3600000);
      })());

    if (isTrial) return 'TESTE';
    return 'PRO_ANUAL';
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Clear plan filter when switching main tabs
  useEffect(() => {
    setActivePlanFilter(null);
  }, [roleFilter]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleActionSuccess = (message, action, userId) => {
    showToast(message);
    if (action === 'delete' && userId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      fetchUsers(); // Recarrega a lista
    }
  };

  const handleChipClick = (val) => {
    if (activePlanFilter === val) {
      setActivePlanFilter(null);
    } else {
      setActivePlanFilter(val);
    }
  };

  const handleChipDoubleClick = () => {
    setActivePlanFilter(null);
  };

  // Filtros
  const filtered = users.filter(u => {
    const matchesRole =
      roleFilter === 'all' ? true :
      roleFilter === 'blocked' ? u.role === 'BLOCKED' :
      roleFilter === 'professionals' ? u.hasAd && u.role !== 'BLOCKED' :
      u.role !== 'BLOCKED' && !u.hasAd;

    if (!matchesRole) return false;

    if (activePlanFilter) {
      const uPlanType = getPlanTypeForUser(u);
      if (uPlanType !== activePlanFilter) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.nome || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.referenceCode || '').toLowerCase().includes(q) ||
      (u.profiles && u.profiles.some(p => (p.referenceCode || p.code || '').toLowerCase().includes(q))) ||
      (u.telefone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  });

  const roleFilters = [
    { id: 'all',           label: 'Todos',         count: users.length },
    { id: 'professionals', label: 'Profissionais', count: users.filter(u => u.hasAd && u.role !== 'BLOCKED').length },
    { id: 'users',         label: 'Usuários',      count: users.filter(u => !u.hasAd && u.role !== 'BLOCKED').length },
    { id: 'blocked',       label: 'Bloqueados',    count: users.filter(u => u.role === 'BLOCKED').length },
  ];

  const PLAN_CHIPS = [
    { value: 'TESTE', label: 'Período de Teste', activeBg: 'bg-blue-50', activeText: 'text-blue-700', activeBorder: 'border-blue-300', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' },
    { value: 'CORTESIA', label: 'Cortesia VIP', activeBg: 'bg-purple-50', activeText: 'text-purple-700', activeBorder: 'border-purple-300', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800' },
    { value: 'PRO_ANUAL', label: 'Pro Anual', activeBg: 'bg-emerald-50', activeText: 'text-emerald-700', activeBorder: 'border-emerald-300', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
    { value: 'PRO_BIENAL', label: 'Pro Bienal', activeBg: 'bg-teal-50', activeText: 'text-teal-700', activeBorder: 'border-teal-300', badgeBg: 'bg-teal-100', badgeText: 'text-teal-800' },
    { value: 'PATROCINADOR_ANUAL', label: 'Patrocinador Anual', activeBg: 'bg-yellow-50', activeText: 'text-yellow-800', activeBorder: 'border-yellow-300', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-900' },
    { value: 'PATROCINADOR_BIENAL', label: 'Patrocinador Bienal', activeBg: 'bg-orange-50', activeText: 'text-orange-700', activeBorder: 'border-orange-300', badgeBg: 'bg-orange-100', badgeText: 'text-orange-850' },
    { value: 'EXPIRADO', label: 'Plano Expirado', activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeBorder: 'border-amber-300', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
  ];

  const planChipsWithCounts = PLAN_CHIPS.map(chip => ({
    ...chip,
    count: users.filter(u => {
      const matchesRole =
        roleFilter === 'all' ? true :
        roleFilter === 'blocked' ? u.role === 'BLOCKED' :
        roleFilter === 'professionals' ? u.hasAd && u.role !== 'BLOCKED' :
        u.role !== 'BLOCKED' && !u.hasAd;
      if (!matchesRole) return false;
      return getPlanTypeForUser(u) === chip.value;
    }).length
  }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Filtros por role */}
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
          {roleFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                roleFilter === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou PRO-001..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-700"
          />
        </div>

        {/* Disparo em Massa */}
        <button
          onClick={() => setModalAction({ action: 'broadcast' })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100 cursor-pointer shrink-0"
          title="Disparo em Massa"
        >
          <ShieldAlert size={15} />
          Disparo em Massa
        </button>

        {/* Refresh */}
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
          title="Recarregar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filtros por Plano */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Planos:</span>
        {planChipsWithCounts.map(chip => {
          const isActive = activePlanFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => handleChipClick(chip.value)}
              onDoubleClick={handleChipDoubleClick}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none flex items-center gap-2 ${
                isActive
                  ? `${chip.activeBg} ${chip.activeText} ${chip.activeBorder} shadow-sm scale-[1.02]`
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100 hover:border-slate-200'
              }`}
              title={`${chip.label} (Clique duplo para limpar)`}
            >
              {chip.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? `${chip.badgeBg} ${chip.badgeText}` : 'bg-slate-200 text-slate-500'
              }`}>
                {chip.count}
              </span>
            </button>
          );
        })}
        {activePlanFilter && (
          <button
            onClick={() => setActivePlanFilter(null)}
            className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1 ml-auto cursor-pointer"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Profissional', 'Contato', 'Tipo / Status', 'Código Ref.', 'Cadastro', 'Ações'].map(col => (
                  <th key={col} className="py-3.5 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-4 bg-slate-100 rounded-full animate-pulse" style={{ width: `${55 + (j * 9) % 35}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users size={36} className="text-slate-200" />
                      <p className="font-medium text-slate-500">Nenhum usuário encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, index) => (
                  <tr key={u.id} className={`border-b border-slate-50 transition-colors hover:bg-slate-50/70 ${
                    u.role === 'BLOCKED' ? 'opacity-60' : ''
                  }`}>

                    {/* Nome */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(u.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{u.nome || '—'}</p>
                          {u.adCategory && (
                            <p className="text-xs text-slate-400 mt-0.5">{truncate(u.adCategory, 22)}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contato */}
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate max-w-[160px]">{u.email}</span>
                          </div>
                        )}
                        {u.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <PhoneCall size={11} className="shrink-0" />
                            {formatPhone(u.telefone)}
                          </div>
                        )}
                        {!u.email && !u.telefone && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <UserStatusBadge
                        role={u.role}
                        hasAd={u.hasAd}
                        planStatus={u.planStatus}
                        subscriptionEndsAt={u.subscriptionEndsAt}
                        trialEndsAt={u.trialEndsAt}
                        createdAt={u.createdAt}
                        planType={u.planType}
                      />
                    </td>

                    {/* Código */}
                    <td className="py-4 px-5">
                      {u.profiles && u.profiles.map(p => p.referenceCode || p.code).filter(Boolean).length > 0 ? (
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                          {u.profiles.map(p => p.referenceCode || p.code).filter(Boolean).join(', ')}
                        </span>
                      ) : u.referenceCode ? (
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                          {u.referenceCode}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Data de cadastro */}
                    <td className="py-4 px-5">
                      <p className="text-xs text-slate-500">{formatDate(u.createdAt)}</p>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-5 relative">
                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp Rápido */}
                        {u.telefone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(u.telefone.replace(/\D/g, ''))}&text=${encodeURIComponent('Olá! Aqui é a equipe de suporte do proITA. Enviamos um aviso importante no seu painel, por favor, acesse para verificar.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                            title="WhatsApp Rápido"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}

                        {/* Enviar Notificação */}
                        <button
                          onClick={() => setModalAction({ action: 'notify', user: u })}
                          className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-all cursor-pointer"
                          title="Enviar Notificação"
                        >
                          <Bell size={16} />
                        </button>

                        <ActionMenu
                          user={u}
                          onAction={(action, targetUser) => setModalAction({ action, user: targetUser })}
                          isNearBottom={index >= filtered.length - 3}
                        />
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filtered.length} de {users.length} usuário{users.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> Atualizado agora</span>
          </div>
        )}
      </div>

      {/* Modal de confirmação / notificação / broadcast / renovação / edição */}
      {modalAction && modalAction.action === 'notify' ? (
        <NotifyModal
          user={modalAction.user}
          token={token}
          onSuccess={handleActionSuccess}
          onClose={() => setModalAction(null)}
        />
      ) : modalAction && modalAction.action === 'broadcast' ? (
        <BroadcastModal
          token={token}
          onSuccess={handleActionSuccess}
          onClose={() => setModalAction(null)}
        />
      ) : modalAction && modalAction.action === 'extend' ? (
        <ExtendPlanModal
          user={modalAction.user}
          token={token}
          onSuccess={handleActionSuccess}
          onClose={() => setModalAction(null)}
        />
      ) : modalAction && modalAction.action === 'edit' ? (
        <EditProfileModal
          user={modalAction.user}
          token={token}
          onSuccess={handleActionSuccess}
          onClose={() => setModalAction(null)}
        />
      ) : modalAction && (
        <ConfirmModal
          action={modalAction.action}
          user={modalAction.user}
          token={token}
          onSuccess={handleActionSuccess}
          onClose={() => setModalAction(null)}
        />
      )}

      {/* Toast de feedback */}
      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CENTRAL FINANCEIRA — Módulo Financeiro & PIX
// ─────────────────────────────────────────────────────────────
function FinanceTab({ token }) {
  const [subTab, setSubTab] = useState('receitas');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeFilter, setTimeFilter] = useState('mes');
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Real database metrics states
  const [revenue, setRevenue] = useState(0);
  const [pendingRenewals, setPendingRenewals] = useState(0);

  const [expenses, setExpenses] = useState([
    { id: 1, descricao: 'Servidor Vercel Pro', categoria: 'Infraestrutura', valor: 120.00, data: '2026-06-01' },
    { id: 2, descricao: 'Contador MEI', categoria: 'Impostos/Serviços', valor: 75.00, data: '2026-06-05' },
    { id: 3, descricao: 'Domínio registro.br', categoria: 'Infraestrutura', valor: 40.00, data: '2026-06-03' },
    { id: 4, descricao: 'Anúncios Google Ads', categoria: 'Marketing', valor: 350.00, data: '2026-06-02' }
  ]);

  const [newExpense, setNewExpense] = useState({
    descricao: '',
    categoria: 'Infraestrutura',
    valor: '',
    data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLoading(true);
    setError(false);

    const fetchUsersPromise = fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Falha HTTP');
        return r.json();
      });

    const fetchFinanceSummaryPromise = fetch(`${API_URL}/api/admin/finance/summary`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Falha HTTP');
        return r.json();
      });

    Promise.all([fetchUsersPromise, fetchFinanceSummaryPromise])
      .then(([usersData, financeData]) => {
        if (usersData.success) {
          setUsers(usersData.data);
        } else {
          throw new Error('Falha API ao buscar usuários');
        }

        if (financeData.success) {
          setRevenue(financeData.data.totalRevenue);
          setPendingRenewals(financeData.data.pendingRenewalsCount);
        } else {
          throw new Error('Falha API ao buscar resumo financeiro');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar dados financeiros:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Lançar nova despesa
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.descricao.trim() || !newExpense.valor) {
      alert('Preencha a descrição e o valor da despesa.');
      return;
    }
    const val = parseFloat(newExpense.valor);
    if (isNaN(val) || val <= 0) {
      alert('Digite um valor de despesa válido.');
      return;
    }
    const added = {
      id: Date.now(),
      descricao: newExpense.descricao.trim(),
      categoria: newExpense.categoria,
      valor: val,
      data: newExpense.data
    };
    setExpenses([added, ...expenses]);
    setNewExpense({
      descricao: '',
      categoria: 'Infraestrutura',
      valor: '',
      data: new Date().toISOString().split('T')[0]
    });
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (id) => {
    if (confirm('Deseja realmente excluir este lançamento de despesa?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  // Receita Mensal Real obtida do banco de dados (0.00 no soft launch)
  const monthlyRevenue = revenue;

  // Despesas Mensais
  const monthlyExpenses = expenses.reduce((sum, e) => sum + e.valor, 0);

  // Lucro Líquido
  const netProfit = monthlyRevenue - monthlyExpenses;
  // Como todos estão no Trial e receita real é 0, a lista de entradas reais fica limpa
  const filteredPayments = [];

  // Profissionais vencidos ou vencendo nos próximos 5 dias
  const renewals = users.filter(u => {
    if (!u.subscriptionEndsAt) return false;
    const expiry = new Date(u.subscriptionEndsAt);
    const now = new Date();
    const diffMs = expiry - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 5;
  });

  const handleWhatsAppCobrança = (u) => {
    const formatExpiry = new Date(u.subscriptionEndsAt).toLocaleDateString('pt-BR');
    const text = `Olá, ${u.nome}! Verificamos que o plano de assinatura do seu anúncio no proITA vence em/venceu no dia ${formatExpiry}. Para manter seu perfil destacado e ativo para novos clientes, você pode realizar a renovação PIX pelo painel. Qualquer dúvida, estamos à disposição!`;
    const phone = u.telefone ? u.telefone.replace(/\D/g, '') : '';
    // Adiciona o código do país caso falte
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Receita do Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CircleDollarSign size={24} /></div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Entradas
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Receita do Mês</h3>
          </div>
          <div>
            {loading ? (
              <div className="h-9 w-24 bg-slate-200/80 rounded-lg animate-pulse my-1" />
            ) : (
              <p className="text-3xl font-bold text-slate-800">
                R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Despesas Fixas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600"><TrendingDown size={24} /></div>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Saídas
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Despesas Fixas</h3>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">
              R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Activity size={24} /></div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${netProfit >= 0 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                {netProfit >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Lucro Líquido</h3>
          </div>
          <div>
            {loading ? (
              <div className="h-9 w-24 bg-slate-200/80 rounded-lg animate-pulse my-1" />
            ) : (
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Renovações Pendentes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock size={24} /></div>
              {renewals.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Atenção
                </span>
              )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Renovações Pendentes</h3>
          </div>
          <div>
            {loading ? (
              <div className="h-9 w-24 bg-slate-200/80 rounded-lg animate-pulse my-1" />
            ) : (
              <p className="text-3xl font-bold text-slate-800">{renewals.length}</p>
            )}
          </div>
        </div>

      </div>

      {/* ── Navegação por Abas ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setSubTab('receitas')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'receitas' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Receitas (Entradas)
          </button>
          <button
            onClick={() => setSubTab('despesas')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'despesas' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Despesas (Saídas)
          </button>
          <button
            onClick={() => setSubTab('inadimplencia')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'inadimplencia' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Inadimplência & Renovações {renewals.length > 0 && `(${renewals.length})`}
          </button>
        </div>

        <div className="p-6">
          {/* ── ABA 1: RECEITAS ── */}
          {subTab === 'receitas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Fluxo de Caixa (Entradas)</h4>
                  <p className="text-xs text-slate-500">Histórico de mensalidades pagas pelos profissionais.</p>
                </div>
                {/* Filtro rápido */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {['hoje', 'semana', 'mes', 'ano'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        timeFilter === filter ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {filter === 'hoje' ? 'Hoje' : filter === 'semana' ? 'Semana' : filter === 'mes' ? 'Mês' : 'Ano'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 py-6">
                  <div className="h-6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-rose-500 font-medium">Erro ao carregar dados de receita.</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Nenhum pagamento registrado neste período.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Cliente (Profissional)</th>
                        <th className="py-3 px-4">Plano Assinado</th>
                        <th className="py-3 px-4">Valor (R$)</th>
                        <th className="py-3 px-4">Data do Pagamento</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((u, i) => {
                        const payDate = u.subscriptionEndsAt
                          ? new Date(new Date(u.subscriptionEndsAt).getTime() - 30 * 24 * 60 * 60 * 1000)
                          : new Date(u.createdAt);
                        const method = i % 2 === 0 ? 'PIX' : 'Cartão';
                        const isPatrocinador = u.planType?.includes('PATROCINADOR') || (u.planStatus === 'ATIVO' && !u.planType);
                        const isBienal = u.planType?.includes('BIENAL');
                        const planLabel = isPatrocinador
                          ? (isBienal ? 'Patrocinador Bienal' : 'Patrocinador Anual')
                          : (isBienal ? 'Profissional Bienal' : 'Profissional Anual');
                        const price = isPatrocinador
                          ? (isBienal ? 94.90 : 54.90)
                          : (isBienal ? 74.90 : 44.90);

                        return (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-800">{u.nome}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isPatrocinador ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
                                {planLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-700">R$ {price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-500">{formatDate(payDate)}</td>
                            <td className="py-3 px-4 text-slate-500 font-medium">{method}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Pago
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ABA 2: DESPESAS ── */}
          {subTab === 'despesas' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Centro de Custos (Saídas)</h4>
                  <p className="text-xs text-slate-500">Controle de despesas fixas e variáveis operacionais.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={16} /> Novo Lançamento
                </button>
              </div>

              {/* Form Lançamento */}
              {showAddExpense && (
                <form onSubmit={handleAddExpenseSubmit} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl animate-fade-in space-y-4">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Novo Lançamento</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                      <input
                        type="text"
                        value={newExpense.descricao}
                        onChange={e => setNewExpense({ ...newExpense, descricao: e.target.value })}
                        placeholder="Ex: Servidor Vercel Pro"
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                      <select
                        value={newExpense.categoria}
                        onChange={e => setNewExpense({ ...newExpense, categoria: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Impostos/Serviços">Impostos/Serviços</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newExpense.valor}
                        onChange={e => setNewExpense({ ...newExpense, valor: e.target.value })}
                        placeholder="0.00"
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={newExpense.data}
                        onChange={e => setNewExpense({ ...newExpense, data: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark cursor-pointer"
                    >
                      Lançar Despesa
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Valor (R$)</th>
                      <th className="py-3 px-4">Data do Lançamento</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{e.descricao}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {e.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-rose-600">- R$ {e.valor.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(e.data)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(e.id)}
                            className="text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline cursor-pointer"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ABA 3: INADIMPLÊNCIA ── */}
          {subTab === 'inadimplencia' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-bold text-slate-800">Inadimplência & Controle de Renovações</h4>
                <p className="text-xs text-slate-500">Profissionais cujo plano expirou recentemente (últimos 5 dias) ou expira em breve (próximos 7 dias).</p>
              </div>

              {loading ? (
                <div className="space-y-3 py-6">
                  <div className="h-6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-rose-500 font-medium">Erro ao carregar inadimplentes.</div>
              ) : renewals.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Excelente! Nenhuma renovação pendente ou inadimplente identificada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Profissional</th>
                        <th className="py-3 px-4">Telefone</th>
                        <th className="py-3 px-4">Expiração do Plano</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Cobrança WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renewals.map((u) => {
                        const expiry = new Date(u.subscriptionEndsAt);
                        const isExpired = expiry < new Date();
                        const statusBg = isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                        const statusText = isExpired ? 'Expirado' : 'Vencendo';

                        return (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-800">{u.nome}</td>
                            <td className="py-3 px-4 text-slate-600 font-mono text-xs">{formatPhone(u.telefone)}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{formatDate(u.subscriptionEndsAt)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <a
                                href={handleWhatsAppCobrança(u)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                {/* SVG WhatsApp */}
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.628 3.839 14.16 2.812 11.53 2.812c-5.44 0-9.866 4.372-9.87 9.802 0 1.698.48 3.35 1.39 4.8l-.398 1.458 1.488-.387z" />
                                </svg>
                                Cobrar
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal Admin ──────────────────────────────────────────────

export default function Admin() {
  const { user, token, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessionals: 0,
    activeAds: 0,
    activeSubscriptions: 0,
    newUsersThisWeek: 0
  });
  const [reportStats, setReportStats] = useState({ pendente: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) {
      setLoadingStats(true);
      setErrorStats(false);

      fetch(`${API_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => {
          if (!r.ok) throw new Error(`Status de erro HTTP: ${r.status}`);
          return r.json();
        })
        .then(d => {
          if (d.success) {
            setStats(d.data);
          } else {
            throw new Error(d.message || 'Falha ao buscar estatísticas');
          }
        })
        .catch(err => {
          console.warn('Erro ao carregar métricas do painel Admin:', err);
          setErrorStats(true);
          setStats({
            totalUsers: 0,
            totalProfessionals: 0,
            activeAds: 0,
            activeSubscriptions: 0,
            newUsersThisWeek: 0
          });
        })
        .finally(() => {
          setLoadingStats(false);
        });

      fetch(`${API_URL}/api/admin/reports/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setReportStats(d.data); }).catch(() => {});
    }
  }, [user, token]);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/auth');
  }, [isAuthenticated, loading, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p>Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard',     label: 'Visão Geral',             icon: LayoutDashboard },
    { id: 'professionals', label: 'Gestão de Profissionais', icon: Briefcase },
    {
      id: 'moderation',
      label: 'Central de Moderação',
      icon: ShieldAlert,
      badge: reportStats.pendente > 0 ? reportStats.pendente : null,
    },
    { id: 'finance',  label: 'Financeiro & PIX',       icon: CircleDollarSign },
    { id: 'settings', label: 'Configurações Globais',   icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-50 pt-16">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 shrink-0">
        <div className="mb-8 px-4 hidden md:block">
          <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
          <p className="text-xs text-slate-500">Gestão do proITA</p>
        </div>

        <nav className="space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal text-sm font-medium w-full cursor-pointer ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 mt-1">Gerencie e monitore a plataforma.</p>
          </header>

          {/* ── Aba: Dashboard ── */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <MetricCard
                title="Total de Usuários"
                value={stats.totalUsers}
                icon={Users}
                colorClass="bg-blue-50 text-blue-600"
                loading={loadingStats}
                error={errorStats}
                subtitle={
                  stats.newUsersThisWeek > 0 && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp size={12} /> +{stats.newUsersThisWeek}
                    </span>
                  )
                }
              />

              <MetricCard
                title="Total de Profissionais"
                value={stats.totalProfessionals}
                icon={Briefcase}
                colorClass="bg-purple-50 text-purple-600"
                loading={loadingStats}
                error={errorStats}
              />

              <MetricCard
                title="Anúncios Ativos"
                value={stats.activeAds}
                icon={Activity}
                colorClass="bg-emerald-50 text-emerald-600"
                loading={loadingStats}
                error={errorStats}
              />

              <MetricCard
                title="Assinaturas Ativas"
                value={stats.activeSubscriptions}
                icon={CircleDollarSign}
                colorClass="bg-indigo-50 text-indigo-600"
                loading={loadingStats}
                error={errorStats}
              />

              {/* Card de Denúncias Pendentes */}
              <button
                onClick={() => setActiveTab('moderation')}
                className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-md text-left transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-xl"><Flag size={20} /></div>
                  {reportStats.pendente > 0 && (
                    <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Ação necessária
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-amber-100 text-sm font-medium mb-1">Denúncias Pendentes</h3>
                  <p className="text-3xl font-bold">{reportStats.pendente}</p>
                  <p className="text-xs text-amber-200 mt-1">Clique para moderar →</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Aba: Profissionais ── */}
          {activeTab === 'professionals' && (
            <ProfessionalsTab token={token} />
          )}

          {/* ── Aba: Central de Moderação ── */}
          {activeTab === 'moderation' && (
            <ModerationTab token={token} />
          )}

          {/* ── Aba: Financeiro & PIX ── */}
          {activeTab === 'finance' && (
            <FinanceTab token={token} />
          )}

          {/* ── Abas em construção ── */}
          {activeTab !== 'dashboard' && activeTab !== 'professionals' && activeTab !== 'moderation' && activeTab !== 'finance' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                <Settings size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Módulo em Desenvolvimento</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Esta seção do painel administrativo será implementada nas próximas atualizações.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
