import { Search as SearchIcon, Wrench, Zap, Paintbrush, Sparkles, Clock, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [popularSearches, setPopularSearches] = useState([]);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch categorias populares (atividades principais) em vez do histórico de buscas
    fetch(`${API_URL}/api/categories/popular`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setPopularSearches(data.data.map(d => ({ query: d.atividadePrincipal })));
        }
      })
      .catch(err => console.error("Erro popular:", err));
  }, []);

  // ── Debounced autocomplete (apenas atividades principais) ──────
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          // A API já retorna { type: 'category', label: 'Encanador' }
          setSuggestions(data.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Erro autocomplete:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const executeSearch = async (term) => {
    if (!term.trim()) return;
    try {
      await fetch(`${API_URL}/api/search-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term })
      });
    } catch(err) {
      console.error(err);
    }
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(searchTerm);
  };

  const selectSuggestion = (label) => {
    setSearchTerm(label);
    setShowSuggestions(false);
    executeSearch(label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const defaultShortcuts = [
    { query: 'Encanador' },
    { query: 'Eletricista' },
    { query: 'Pintor' },
    { query: 'Pedreiro' },
  ];

  const shortcuts = popularSearches.length > 0 ? popularSearches : defaultShortcuts;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-white relative flex flex-col justify-center items-center">
      
      {/* Wave Background (Serras - Múltiplas camadas de verde) */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] min-h-[200px] z-10 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          {/* Camada de fundo (mais clara/alta) */}
          <path fill="#34d399" fillOpacity="0.4" d="M0,224L48,202.7C96,181,192,139,288,149.3C384,160,480,224,576,218.7C672,213,768,139,864,133.3C960,128,1056,192,1152,213.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          {/* Camada intermediária */}
          <path fill="#10b981" fillOpacity="0.7" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,202.7C672,192,768,160,864,170.7C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          {/* Camada frontal (mais escura) */}
          <path fill="#059669" fillOpacity="1" d="M0,320L48,298.7C96,277,192,235,288,229.3C384,224,480,256,576,250.7C672,245,768,203,864,186.7C960,171,1056,181,1152,208C1248,235,1344,277,1392,298.7L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 text-center mt-[-10vh]">
        
        {/* Logo Central (Estilo Google) */}
        <div className="flex justify-center mb-8">
          <img src="/logo-proita.svg" alt="proITA Logo" className="h-24 md:h-32 object-contain drop-shadow-sm" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-full p-2 flex items-center shadow-lg border border-slate-200 focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all mb-8 max-w-2xl mx-auto w-full relative">
          <div className="pl-4 md:pl-6 text-slate-400 shrink-0">
            <SearchIcon size={24} />
          </div>
          <div className="flex-1 min-w-0 relative" ref={suggestionsRef}>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Ex: Encanador, Eletricista..."
              className="w-full py-2 px-2 md:px-4 text-slate-800 text-base md:text-lg focus:outline-none bg-transparent placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {/* Dropdown de sugestões */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-left">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectSuggestion(s.label)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <SearchIcon size={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-5 md:px-10 py-3 rounded-full font-bold text-sm md:text-base transition-colors flex items-center justify-center shrink-0">
            Buscar
          </button>
        </form>

        {/* Shortcuts / Chips */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-4 w-full overflow-hidden">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider whitespace-nowrap">
            Mais Buscados:
          </span>
          <div className="flex overflow-x-auto gap-3 pb-2 whitespace-nowrap w-full md:w-auto px-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {shortcuts.map((shortcut, index) => {
              return (
                <button 
                  key={index}
                  onClick={() => executeSearch(shortcut.query)}
                  className="flex-shrink-0 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-full transition-all hover:scale-105 hover:border-slate-300"
                >
                  <SearchIcon size={14} className="text-primary opacity-50" />
                  <span className="font-medium text-sm capitalize">{shortcut.query}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer minimalista colado na base - texto branco sobre as serras verdes */}
      <footer className="absolute bottom-4 w-full text-center z-30">
        <p className="text-white/90 text-xs font-medium tracking-wide drop-shadow-md">
          &copy; {new Date().getFullYear()} proITA - Guia dos Três Climas. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
