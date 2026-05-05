import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, X, ArrowRight } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [profissionais, setProfissionais] = useState([]);
  const [results, setResults] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from backend
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
              shortDescription: profile.shortDescription || profile.descricaoTrabalho?.substring(0, 90) + '...',
              fullDescription: profile.descricaoTrabalho,
              phone: profile.user.telefone,
              servicePhone: profile.servicePhone || null,
              serviceBairro: profile.serviceBairro || null,
              socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
              instagram: instagram,
              avatar: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.nome)}+${encodeURIComponent(profile.user.sobrenome)}&background=0ea5e9&color=fff&bold=true`
            };
          });
          setProfissionais(mappedData);
          setResults(mappedData);
        }
      } catch (err) {
        console.error("Erro ao buscar profissionais:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    let filtered = profissionais;
    
    if (queryParam) {
      const q = queryParam.toLowerCase();
      filtered = filtered.filter(p => {
        const name = p.name ? p.name.toLowerCase() : '';
        const fullDesc = p.fullDescription ? p.fullDescription.toLowerCase() : '';
        const shortDesc = p.shortDescription ? p.shortDescription.toLowerCase() : '';
        const cat = p.category ? p.category.toLowerCase() : '';
        return name.includes(q) || fullDesc.includes(q) || shortDesc.includes(q) || cat.includes(q);
      });
    }

    if (categoryParam) {
      const c = categoryParam.toLowerCase();
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === c);
    }

    setResults(filtered);
    setSearchTerm(queryParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, categoryParam, profissionais]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
    setSelectedCategory('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-0">
      {/* pt-24 para compensar o header fixed */}
      
      {/* SEÇÃO 1: RESULTADOS DE BUSCA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        
        {/* Header and Mobile Filter Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {results.length} {results.length === 1 ? 'Profissional encontrado' : 'Profissionais encontrados'}
          </h1>
          <button 
            className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-700"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={18} /> Filtrar
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside className={`md:w-1/4 ${isFilterOpen ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h2 className="font-bold text-lg">Filtros</h2>
                <button onClick={() => setIsFilterOpen(false)}><X size={20} className="text-slate-500" /></button>
              </div>

              <form onSubmit={handleSearch}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome ou palavra-chave..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                    <SearchIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
                  >
                    <option value="">Todas as categorias</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg font-medium transition-colors mb-3">
                  Aplicar Filtros
                </button>
                
                {(queryParam || categoryParam) && (
                  <button type="button" onClick={clearFilters} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors text-sm">
                    Limpar Filtros
                  </button>
                )}
              </form>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="md:w-3/4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  Ainda não temos profissionais nesta categoria. Seja o primeiro a anunciar!
                </h3>
                <p className="text-slate-500 mb-6">Tente ajustar seus filtros ou buscar por termos mais genéricos.</p>
                <button onClick={clearFilters} className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-hover">
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* SEÇÃO 2: PROFISSIONAIS EM DESTAQUE */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Profissionais em Destaque</h2>
              <p className="mt-4 text-slate-600">Os mais bem avaliados pelos clientes proITA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {profissionais.slice(0, 4).map(pro => (
              <AdCard key={pro.id} professional={pro} />
            ))}
            {profissionais.length === 0 && (
              <p className="text-slate-500 col-span-full">Nenhum profissional em destaque no momento.</p>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: CATEGORIAS POPULARES */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Categorias Populares</h2>
            <p className="mt-4 text-slate-600">Explore os serviços mais buscados na sua região</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Categorias fixas removidas temporariamente */}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: CTA ANUNCIAR */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Você é um profissional?</h2>
            <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Anuncie seus serviços gratuitamente, alcance mais clientes em Itapipoca e aumente sua renda.
            </p>
            <Link to="/advertise" className="inline-block bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 hover:scale-105 transition-all shadow-xl">
              Criar meu Anúncio Agora
            </Link>
          </div>
        </section>

    </div>
  );
}
