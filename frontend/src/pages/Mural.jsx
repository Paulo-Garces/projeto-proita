import { useState, useEffect, useCallback } from 'react';
import { Calendar, Building2, ExternalLink, GraduationCap, Briefcase, FileText, RefreshCw, Lightbulb, CreditCard } from 'lucide-react';
import { API_URL } from '../config';

const CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '📰' },
  { id: 'capacitacao', label: 'Capacitação', emoji: '🎓' },
  { id: 'empregos', label: 'Empregos', emoji: '💼' },
  { id: 'editais', label: 'Editais', emoji: '🏛️' },
  { id: 'empreendedorismo', label: 'Empreendedorismo', emoji: '💡' },
  { id: 'credito', label: 'Crédito', emoji: '💳' }
];

export default function Mural() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSyncScraper = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setToast(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/scraper/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({
          message: data.insertedCount > 0 
            ? `Sincronização concluída! ${data.insertedCount} novas oportunidades adicionadas.` 
            : 'Mural atualizado! Nenhuma oportunidade nova encontrada.',
          type: 'success'
        });
        fetchOpportunities();
      } else {
        setToast({
          message: data.error || 'Erro ao sincronizar oportunidades.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      setToast({
        message: 'Erro de rede ao tentar sincronizar o mural.',
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const normalizeCategory = (cat) => {
    if (!cat) return 'all';
    const normalized = cat.toLowerCase().trim();
    if (normalized.includes('capacita') || normalized.includes('capacitação')) return 'capacitacao';
    if (normalized.includes('emprego')) return 'empregos';
    if (normalized.includes('edital') || normalized.includes('editais')) return 'editais';
    if (normalized.includes('empreendedor') || normalized.includes('empreendedorismo')) return 'empreendedorismo';
    if (normalized.includes('credito') || normalized.includes('crédito')) return 'credito';
    return 'all';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/mural`);
      const data = await res.json();
      if (res.ok && data.success) {
        // Mapear os dados vindos do banco para o formato esperado pelo layout
        const mappedData = (data.data || []).map(item => ({
          id: item.id,
          category: normalizeCategory(item.category),
          categoryLabel: item.category,
          title: item.title,
          description: item.description,
          date: formatDate(item.publishedDate),
          source: item.sourceName || 'Fonte Oficial',
          source_url: item.sourceUrl || '#'
        }));
        setOpportunities(mappedData);
      } else {
        setError(data.error || 'Não foi possível carregar as oportunidades.');
      }
    } catch (err) {
      console.error('Erro ao buscar mural:', err);
      setError('Erro de conexão ao tentar carregar o mural.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const filteredOportunidades = activeCategory === 'all'
    ? opportunities
    : opportunities.filter(item => item.category === activeCategory);

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'capacitacao':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'empregos':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'editais':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'empreendedorismo':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'credito':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'capacitacao':
        return <GraduationCap size={14} className="mr-1.5 inline-block align-text-bottom text-sky-500" />;
      case 'empregos':
        return <Briefcase size={14} className="mr-1.5 inline-block align-text-bottom text-emerald-500" />;
      case 'editais':
        return <FileText size={14} className="mr-1.5 inline-block align-text-bottom text-violet-500" />;
      case 'empreendedorismo':
        return <Lightbulb size={14} className="mr-1.5 inline-block align-text-bottom text-amber-500" />;
      case 'credito':
        return <CreditCard size={14} className="mr-1.5 inline-block align-text-bottom text-rose-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto min-h-screen bg-slate-50">
        {/* Título Skeleton */}
        <div className="text-center md:text-left mb-8 animate-pulse">
          <div className="h-9 w-64 bg-slate-200 rounded-lg mb-3"></div>
          <div className="h-4 w-full max-w-md bg-slate-200 rounded-md"></div>
        </div>
        {/* Filtros Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-10 w-28 bg-slate-200 rounded-full shrink-0 animate-pulse"></div>
          ))}
        </div>
        {/* Grid de Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 h-56 flex flex-col justify-between animate-pulse">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-full bg-slate-200 rounded-md mb-2"></div>
                <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-sm max-w-md w-full">
          <p className="text-red-500 font-bold text-lg mb-2">Erro de conexão</p>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={fetchOpportunities}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-semibold transition-all cursor-pointer shadow-md shadow-sky-100"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      <div className="text-center md:text-left mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            Mural de Oportunidades
          </h1>
          <button
            onClick={handleSyncScraper}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-600 hover:text-primary hover:border-sky-200 transition-all shadow-sm cursor-pointer disabled:opacity-50 mx-auto md:mx-0 w-fit`}
            title="Atualizar mural de oportunidades"
          >
            <RefreshCw size={12} className={`${isSyncing ? 'animate-spin text-primary' : 'text-slate-400'}`} />
            <span>{isSyncing ? 'Carregando...' : 'Sincronizar'}</span>
          </button>
        </div>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Fique por dentro das últimas vagas, cursos gratuitos, editais públicos e capacitações em Itapipoca.
        </p>
      </div>

      {/* Filtros em Pílulas com Scroll Horizontal Suave */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-none snap-x select-none">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-150 shrink-0 snap-start flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeCategory === category.id
                ? 'bg-primary text-white border-primary shadow-sky-100'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Oportunidades */}
      {filteredOportunidades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOportunidades.map(item => (
            <div
              key={item.id}
              className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Categoria e Data */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border flex items-center ${getCategoryStyles(item.category)}`}>
                    {getCategoryIcon(item.category)}
                    {item.categoryLabel}
                  </span>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <Calendar size={12} className="mr-1 shrink-0" />
                    {item.date}
                  </div>
                </div>

                {/* Título e Descrição */}
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug line-clamp-2 hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center text-xs text-slate-500 font-semibold max-w-[55%] truncate">
                  <Building2 size={13} className="mr-1.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={item.source}>{item.source}</span>
                </div>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group shrink-0"
                >
                  Acessar original
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium">Nenhuma oportunidade disponível nesta categoria.</p>
        </div>
      )}
      {/* Toast de Feedback */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-100 text-red-800'
            : 'bg-emerald-50 border-emerald-100 text-emerald-800'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-xs font-bold hover:opacity-75 cursor-pointer ml-2">×</button>
        </div>
      )}
    </div>
  );
}
