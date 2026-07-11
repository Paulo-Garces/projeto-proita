import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { 
  Eye, 
  MessageCircle, 
  Heart, 
  Share2, 
  Phone, 
  MousePointerClick, 
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function AdminAnalytics() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (showRefreshAnim = false) => {
    if (!token) return;
    if (showRefreshAnim) setIsRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/analytics-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.data);
      } else {
        throw new Error(resData.message || 'Erro ao carregar métricas.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('pt-BR').format(num || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-10 w-28 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-100 border border-slate-200/60 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 max-w-lg mx-auto text-center flex flex-col items-center gap-3">
        <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
        <h3 className="font-bold text-lg">Falha no Carregamento</h3>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: 'Visualizações de Perfis',
      value: data?.totalProfileViews || 0,
      description: 'Total de visitas às páginas de perfis.',
      icon: Eye,
      color: 'bg-blue-500/10 text-blue-600',
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Cliques no WhatsApp',
      value: data?.totalWhatsappClicks || 0,
      description: 'Contatos diretos iniciados via WhatsApp.',
      icon: MessageCircle,
      color: 'bg-emerald-500/10 text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Impressões de Anúncios',
      value: data?.totalImpressions || 0,
      description: 'Exibições em listas de busca e destaques.',
      icon: MousePointerClick,
      color: 'bg-purple-500/10 text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Favoritados',
      value: data?.totalFavorites || 0,
      description: 'Total de vezes que perfis foram favoritados.',
      icon: Heart,
      color: 'bg-rose-500/10 text-rose-600',
      gradient: 'from-rose-500 to-red-500',
    },
    {
      title: 'Cliques em Telefone',
      value: data?.totalPhoneClicks || 0,
      description: 'Tentativas de contato por ligação direta.',
      icon: Phone,
      color: 'bg-amber-500/10 text-amber-600',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Compartilhamentos',
      value: data?.totalShares || 0,
      description: 'Cliques em copiar link de perfil ou compartilhar.',
      icon: Share2,
      color: 'bg-sky-500/10 text-sky-600',
      gradient: 'from-sky-500 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Performance Consolidada
          </h2>
          <p className="text-xs text-slate-500">Estatísticas acumuladas de todos os anúncios ativos.</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200/80 group"
            >
              {/* Subtle top color bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300 group-hover:text-indigo-900">
                {formatNumber(card.value)}
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
