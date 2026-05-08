import { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, X, User, MapPin, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Search() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [profissionais, setProfissionais] = useState([]);
  const [results, setResults] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Popular Categories state
  const [popularCategories, setPopularCategories] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/categories/popular')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPopularCategories(data.data.map(d => d.atividadePrincipal));
        }
      })
      .catch(err => console.error(err));
  }, []);

  // ── Fetch ads ────────────────────────────────────────────────
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/ads');
        const data = await res.json();
        if (res.ok && data.success) {
          const mappedData = data.data.map(profile => {
            let instagram = '';
            if (profile.redesSociais) {
              if (Array.isArray(profile.redesSociais)) {
                const instaMatch = profile.redesSociais.find(r => r.includes('instagram'));
                if (instaMatch) instagram = instaMatch;
              } else if (typeof profile.redesSociais === 'object') {
                instagram = profile.redesSociais.instagram || '';
              }
            }
            return {
              id: profile.id,
              name: `${profile.user.nome} ${profile.user.sobrenome}`,
              category: profile.atividadePrincipal,
              rating: 5.0,
              reviewsCount: 0,
              location: profile.user.bairro || 'Itapipoca',
              shortDescription: profile.shortDescription || (profile.descricaoTrabalho?.substring(0, 90) + '...'),
              fullDescription: profile.descricaoTrabalho,
              phone: profile.user.telefone,
              servicePhone: profile.servicePhone || null,
              serviceBairro: profile.serviceBairro || null,
              socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
              instagram,
              visitasPerfil: profile.visitasPerfil || 0,
              cliquesWhatsapp: profile.cliquesWhatsapp || 0,
              avatar: profile.user.profileImageUrl
                || profile.avatarUrl
                || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.nome)}+${encodeURIComponent(profile.user.sobrenome)}&background=0ea5e9&color=fff&bold=true`,
            };
          });
          setProfissionais(mappedData);
          setResults(mappedData);
        }
      } catch (err) {
        console.error('Erro ao buscar profissionais:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, []);

  // ── Filter results when params change ────────────────────────
  useEffect(() => {
    let filtered = profissionais;
    if (queryParam) {
      const q = queryParam.toLowerCase();
      filtered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat  = (p.category || '').toLowerCase();
        const desc = (p.fullDescription || '').toLowerCase();
        const short = (p.shortDescription || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || desc.includes(q) || short.includes(q);
      });
    }
    if (categoryParam) {
      const c = categoryParam.toLowerCase();
      filtered = filtered.filter(p => p.category?.toLowerCase() === c);
    }
    setResults(filtered);
    setSearchTerm(queryParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, categoryParam, profissionais]);

  // ── Debounced autocomplete ────────────────────────────────────
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      const q = searchTerm.toLowerCase();
      const seen = new Set();
      const list = [];

      profissionais.forEach(p => {
        if (p.name?.toLowerCase().includes(q) && !seen.has(p.name)) {
          seen.add(p.name);
          list.push({ type: 'name', label: p.name });
        }
      });
      
      try {
        const res = await fetch(`http://localhost:5000/api/subcategories/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success) {
          data.data.forEach(sub => {
            if (!seen.has(sub.name)) {
              seen.add(sub.name);
              list.push({ type: 'category', label: sub.name });
            }
          });
        }
      } catch (err) {
        console.error(err);
      }

      const top6 = list.slice(0, 6);
      setSuggestions(top6);
      setShowSuggestions(top6.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, profissionais]);

  // ── Close suggestions on outside click ───────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Unique categories (dynamic) ───────────────────────────────
  const uniqueCategories = [...new Set(profissionais.map(p => p.category).filter(Boolean))].sort();

  // ── Handlers ─────────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (label) => {
    setSearchTerm(label);
    setShowSuggestions(false);
    const params = { q: label };
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
    setSelectedCategory('');
  };

  const handleCtaClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?mode=register');
    } else if (user.profiles && user.profiles.length > 0) {
      navigate('/dashboard');
    } else {
      navigate('/advertise');
    }
  };

  const destaques = [...profissionais].sort((a, b) => {
    const scoreA = a.visitasPerfil + (a.cliquesWhatsapp * 2);
    const scoreB = b.visitasPerfil + (b.cliquesWhatsapp * 2);
    return scoreB - scoreA;
  }).slice(0, 4);

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-0">

      {/* ── SEÇÃO 1: RESULTADOS ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isLoading ? 'Buscando...' : `${results.length} ${results.length === 1 ? 'Profissional encontrado' : 'Profissionais encontrados'}`}
          </h1>
          <button
            className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-700"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={18} /> Filtrar
          </button>
        </div>

        {/* Categorias Populares (Chips) */}
        {popularCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className="text-sm font-medium text-slate-500 mr-2 flex items-center gap-1">
              <Sparkles size={16} className="text-amber-500" /> Em alta:
            </span>
            {popularCategories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSearchParams({ category: cat });
                }}
                className="bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar / Filters */}
          <aside className={`md:w-72 shrink-0 ${isFilterOpen ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h2 className="font-bold text-lg">Filtros</h2>
                <button onClick={() => setIsFilterOpen(false)}><X size={20} className="text-slate-500" /></button>
              </div>

              <form onSubmit={handleSearch}>
                {/* Input com autocomplete */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
                  <div className="relative" ref={suggestionsRef}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Nome ou palavra-chave..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all"
                      autoComplete="off"
                    />
                    <SearchIcon size={16} className="absolute left-3 top-3 text-slate-400" />

                    {/* Dropdown de sugestões */}
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => selectSuggestion(s.label)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                          >
                            {s.type === 'name' ? (
                              <User size={13} className="text-slate-400 shrink-0" />
                            ) : (
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{s.label}</span>
                            <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-wide shrink-0">
                              {s.type === 'name' ? 'Pessoa' : 'Categoria'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Categoria (dinâmica) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white outline-none"
                  >
                    <option value="">Todas as categorias</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-medium transition-colors mb-3">
                  Aplicar Filtros
                </button>
                {(queryParam || categoryParam) && (
                  <button type="button" onClick={clearFilters} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-medium transition-colors text-sm">
                    Limpar Filtros
                  </button>
                )}
              </form>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {results.map(pro => (
                  <AdCard key={pro.id} professional={pro} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Nenhum profissional encontrado.
                </h3>
                <p className="text-slate-500 mb-6">Tente termos mais genéricos ou limpe os filtros.</p>
                <button onClick={clearFilters} className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-hover">
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── SEÇÃO 2: DESTAQUE ───────────────────────────────── */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Profissionais em Destaque</h2>
            <p className="mt-2 text-slate-500">Os mais bem avaliados pelos clientes proITA</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {destaques.map(pro => (
              <AdCard key={pro.id} professional={pro} />
            ))}
            {destaques.length === 0 && (
              <p className="text-slate-500 col-span-full">Nenhum profissional em destaque no momento.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: CTA ─────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Você é um profissional?</h2>
          <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Anuncie seus serviços gratuitamente, alcance mais clientes em Itapipoca e aumente sua renda.
          </p>
          <a href="#" onClick={handleCtaClick} className="inline-block bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 hover:scale-105 transition-all shadow-xl">
            Criar meu Anúncio Agora
          </a>
        </div>
      </section>

    </div>
  );
}
