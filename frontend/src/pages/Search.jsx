import { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, X, ChevronDown, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { getProfileDisplayName, getProfileAvatarNameParam } from '../utils/profileDisplayName';

export default function Search() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(categoryParam);
  const [selectedBairro, setSelectedBairro] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [results, setResults] = useState([]);
  // Em mobile (< 768px): filtros iniciam FECHADOS quando há `q` na URL (vindo de "Buscar")
  // e ABERTOS quando não há (modo "Explorar"). Desktop ignora — o aside é sempre md:block.
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const isMobile = window.innerWidth < 768;
    return !(isMobile && queryParam);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(true);

  // Categorias Gerais fixas
  const categoriasGerais = [
    "Alimentação e Gastronomia",
    "Beleza e Estética",
    "Construção e Reformas",
    "Educação e Aulas",
    "Eventos e Produção",
    "Reparos e Assistência Técnica",
    "Serviços Domésticos e Cuidados",
    "Tecnologia e Design",
    "Transporte e Logística",
    "Saúde e Bem-estar",
    "Serviços Rurais e Paisagismo",
    "Moda e Costura",
    "Turismo e Lazer",
    "Serviços Administrativos e Consultoria",
    "Outros Serviços"
  ];

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  // Suprime o próximo disparo do autocomplete (usado após clicar numa sugestão ou submeter busca),
  // evitando que o dropdown reabra automaticamente quando setSearchTerm dispara o useEffect [searchTerm].
  const skipAutocompleteRef = useRef(false);
  const lastAutoFilledQ = useRef(null);

  // Sempre que houver um termo de busca na URL, força os filtros fechados em mobile.
  // Em desktop, o aside permanece visível (md:block) — esse estado não o afeta.
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (queryParam && isMobile) {
      setIsFilterOpen(false);
    }
  }, [queryParam]);

  // ── Fetch ads ────────────────────────────────────────────────
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/api/ads`, { headers });
        const data = await res.json();
        if (res.ok && data.success) {
          const mappedData = data.data.map(profile => {
            const rawSocial = profile.socialLinks ?? profile.redesSociais;
            const socialLinks = Array.isArray(rawSocial)
              ? rawSocial
                .map((item) => {
                  if (!item || typeof item !== 'object') return null;
                  const platform = (item.platform ?? item.network ?? '').toString().toLowerCase().trim();
                  const url = (item.url ?? item.link ?? '').toString().trim();
                  if (!platform || !url) return null;
                  return { platform, url };
                })
                .filter(Boolean)
              : [];
            const instagramEntry = socialLinks.find((s) => s.platform === 'instagram');
            const instagram = instagramEntry?.url || '';
            return {
              id: profile.id,
              name: getProfileDisplayName(profile),
              category: profile.atividadePrincipal,
              categoriaGeral: profile.categoriaGeral || '',
              rating: profile.rating || 0, // ← AQUI ESTAVA O 5.0 FIXO! AGORA ESTÁ DINÂMICO.
              reviewCount: profile.reviewCount || 0, // ← AQUI TAMBÉM!
              location: profile.serviceBairro || profile.user?.bairro || 'Itapipoca',
              shortDescription: profile.descricaoCurta || profile.shortDescription || (profile.descricaoTrabalho?.substring(0, 90) + '...'),
              fullDescription: profile.descricaoTrabalho,
              phone: (profile.telefoneComercial && profile.telefoneComercial.trim() !== '')
                ? profile.telefoneComercial
                : (profile.user?.telefone || profile.servicePhone || profile.whatsapp || null),
              servicePhone: (profile.telefoneComercial && profile.telefoneComercial.trim() !== '')
                ? profile.telefoneComercial
                : (profile.user?.telefone || profile.servicePhone || profile.whatsapp || null),
              serviceBairro: profile.serviceBairro || null,
              socialLinks,
              instagram,
              visitasPerfil: profile.visitasPerfil || 0,
              cliquesWhatsapp: profile.cliquesWhatsapp || 0,
              isFavorited: profile.isFavorited || false,
              avatar: (profile.fotoAnuncioUrl && profile.fotoAnuncioUrl.trim() !== '')
                ? profile.fotoAnuncioUrl
                : (profile.user?.profileImageUrl
                  || profile.avatarUrl
                  || `https://ui-avatars.com/api/?name=${encodeURIComponent(getProfileAvatarNameParam(profile))}&background=0ea5e9&color=fff&bold=true`),
            };
          });
          setProfissionais(mappedData);
          // A filtragem inicial definirá os resultados no outro useEffect
        }
      } catch (err) {
        console.error('Erro ao buscar profissionais:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, [token]);

  // ── Filter results when params change ────────────────────────
  useEffect(() => {
    let filtered = profissionais;

    const showFavoritesOnly = searchParams.get('favoritos') === 'true';
    if (showFavoritesOnly) {
      filtered = filtered.filter(p => p.isFavorited);
    }

    let derivedCat = searchParams.get('cat') || '';
    let derivedSubcat = categoryParam || '';

    // Quando houver um parâmetro q, vasculhar a estrutura de categorias
    // e preencher os filtros automaticamente se houver correspondência exata,
    // mas apenas uma vez por termo de busca para permitir que o usuário limpe os filtros depois.
    if (queryParam && !derivedCat && !derivedSubcat && lastAutoFilledQ.current !== queryParam) {
      // Procurar se o termo de busca bate exatamente com alguma subcategoria existente
      const exactMatch = profissionais.find(
        p => p.category?.toLowerCase() === queryParam.toLowerCase()
      );
      if (exactMatch) {
        derivedCat = exactMatch.categoriaGeral || '';
        derivedSubcat = exactMatch.category || '';
        
        // Sincroniza a URL imediatamente para que a UI não sofra um reset
        const newParams = new URLSearchParams(searchParams);
        if (derivedCat) newParams.set('cat', derivedCat);
        if (derivedSubcat) newParams.set('category', derivedSubcat);
        setSearchParams(newParams, { replace: true });
      }
      // Se profissionais já foi carregado, marcamos que verificamos este termo
      if (profissionais.length > 0) {
        lastAutoFilledQ.current = queryParam;
      }
    } else if (!queryParam) {
      lastAutoFilledQ.current = null;
    }

    if (queryParam) {
      const q = queryParam.toLowerCase();
      filtered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const catGeral = (p.categoriaGeral || '').toLowerCase();
        const desc = (p.fullDescription || '').toLowerCase();
        const short = (p.shortDescription || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || catGeral.includes(q) || desc.includes(q) || short.includes(q);
      });
    }

    if (derivedCat) {
      filtered = filtered.filter(p => p.categoriaGeral?.toLowerCase() === derivedCat.toLowerCase());
    }

    if (derivedSubcat) {
      const c = derivedSubcat.toLowerCase();
      filtered = filtered.filter(p => p.category?.toLowerCase() === c);
    }

    setResults(filtered);
    setSearchTerm(queryParam);
    setSelectedCategory(derivedCat);
    setSelectedSubcategory(derivedSubcat);
    
    // Quando não estiver mais buscando a API, libera a renderização da lista
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [queryParam, categoryParam, searchParams, profissionais, setSearchParams, isLoading]);

  // ── Debounced autocomplete ──────
  useEffect(() => {
    // Se acabamos de selecionar uma sugestão / submeter a busca, suprime este disparo.
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (searchTerm.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (searchTerm.trim().toLowerCase() === (queryParam || '').trim().toLowerCase()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (skipAutocompleteRef.current) return;
      try {
        const res = await fetch(`${API_URL}/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (skipAutocompleteRef.current) return;
        if (data.success && data.data.length > 0) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Erro no autocomplete:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, queryParam]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProfissionais = selectedCategory
    ? profissionais.filter(p => p.categoriaGeral?.toLowerCase() === selectedCategory.toLowerCase())
    : profissionais;
  const uniqueSubcategories = [...new Set(filteredProfissionais.map(p => p.category).filter(Boolean))].sort();
  const uniqueBairros = [...new Set(profissionais.map(p => p.location).filter(Boolean))].sort();

  const handleSearch = (e) => {
    e?.preventDefault();
    skipAutocompleteRef.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedCategory) params.cat = selectedCategory;
    if (selectedSubcategory) params.category = selectedSubcategory;
    setSearchParams(params);
    // Após buscar, recolhe filtros para os cards ganharem a tela toda (relevante em mobile).
    setIsFilterOpen(false);
    inputRef.current?.blur();
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
    skipAutocompleteRef.current = true;
    setSearchTerm(label);
    setShowSuggestions(false);
    setSuggestions([]);
    const params = { q: label };
    if (selectedCategory) params.cat = selectedCategory;
    if (selectedSubcategory) params.category = selectedSubcategory;
    setSearchParams(params);
    setIsFilterOpen(false);
    inputRef.current?.blur();
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBairro('');
  };

  const handleCtaClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/planos');
    } else {
      navigate('/dashboard/novo-anuncio');
    }
  };

  const destaques = [...profissionais].sort((a, b) => {
    const scoreA = a.visitasPerfil + (a.cliquesWhatsapp * 2);
    const scoreB = b.visitasPerfil + (b.cliquesWhatsapp * 2);
    return scoreB - scoreA;
  }).slice(0, 4);

  const displayResults = selectedBairro
    ? results.filter(p => p.location?.toLowerCase() === selectedBairro.toLowerCase())
    : results;

  const showFavoritesOnly = searchParams.get('favoritos') === 'true';

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-0">

      {/* ── SEÇÃO 1: RESULTADOS ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">

        {showFavoritesOnly ? (
          <div className="mb-8 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Heart className="text-red-500 fill-red-500" size={28} />
              Profissionais Favoritos
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm md:text-base">Sua lista personalizada de profissionais salvos.</p>
          </div>
        ) : (
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative" ref={suggestionsRef}>
              <div className="flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all overflow-hidden">
                <div className="pl-5 text-slate-400">
                  <SearchIcon size={20} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Buscar por atividade, ex: Encanador, Eletricista..."
                  className="flex-1 py-3.5 px-4 text-slate-800 text-base focus:outline-none bg-transparent placeholder:text-slate-400"
                  autoComplete="off"
                />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 font-medium transition-colors text-sm shrink-0">
                  Buscar
                </button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectSuggestion(s.label)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <SearchIcon size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {!showFavoritesOnly && (
          <div className="flex justify-end items-center mb-4 md:hidden">
            <button
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-700"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} /> {isFilterOpen ? 'Ocultar Filtros' : 'Filtrar'}
            </button>
          </div>
        )}


        <div className="flex flex-col md:flex-row gap-8">

          {!showFavoritesOnly && (
            <aside className={`md:w-72 shrink-0 ${isFilterOpen ? 'block' : 'hidden'} md:block`}>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                <div className="flex justify-between items-center mb-5 md:hidden">
                  <h2 className="font-bold text-lg">Filtros</h2>
                  <button onClick={() => setIsFilterOpen(false)}><X size={20} className="text-slate-500" /></button>
                </div>

                <form onSubmit={handleSearch}>
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Categoria Principal</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCategory(val);
                          setSelectedSubcategory('');
                          const params = {};
                          if (searchTerm) params.q = searchTerm;
                          if (val) params.cat = val;
                          setSearchParams(params);
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Todas as categorias</option>
                        {categoriasGerais.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Subcategoria / Atividade</label>
                    <div className="relative">
                      <select
                        value={selectedSubcategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSubcategory(val);
                          const params = {};
                          if (searchTerm) params.q = searchTerm;
                          if (selectedCategory) params.cat = selectedCategory;
                          if (val) params.category = val;
                          setSearchParams(params);
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Todas as atividades</option>
                        {uniqueSubcategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Localidade / Bairro</label>
                    <div className="relative">
                      <select
                        value={selectedBairro}
                        onChange={(e) => setSelectedBairro(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Todos os bairros</option>
                        {uniqueBairros.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-medium transition-colors mb-3">
                    Aplicar Filtros
                  </button>
                  {(queryParam || selectedCategory || selectedSubcategory || selectedBairro) && (
                    <button type="button" onClick={clearFilters} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-medium transition-colors text-sm">
                      Limpar Filtros
                    </button>
                  )}
                </form>
              </div>
            </aside>
          )}

          <main className="flex-1 min-w-0">
            {isLoading || isFiltering ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : displayResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {displayResults.map((pro, index) => (
                  <AdCard key={pro.id} professional={pro} style={{ animationDelay: `${index * 80}ms` }} />
                ))}
              </div>
            ) : (
              showFavoritesOnly ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto animate-in fade-in duration-300">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Heart size={32} className="text-red-500 fill-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Você ainda não salvou nenhum profissional.
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Navegue pelas buscas e clique na bandeirinha para favoritar perfis!
                  </p>
                  <button 
                    onClick={() => setSearchParams({})} 
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors"
                  >
                    Explorar Profissionais
                  </button>
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
              )
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