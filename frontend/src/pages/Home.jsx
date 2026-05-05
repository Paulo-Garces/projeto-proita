import { Search as SearchIcon, Wrench, Zap, Paintbrush, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Simulação local de login para a UI
  const isLoggedIn = false; // Alterar para testar estado logado

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const loggedOutShortcuts = [
    { name: 'Encanador', icon: Wrench, query: 'encanador' },
    { name: 'Eletricista', icon: Zap, query: 'eletricista' },
    { name: 'Pintor', icon: Paintbrush, query: 'pintor' },
    { name: 'Limpeza', icon: Sparkles, query: 'limpeza' },
  ];

  const loggedInShortcuts = [
    { name: 'Pedreiro', icon: Clock, query: 'pedreiro' },
    { name: 'Jardineiro', icon: Clock, query: 'jardineiro' },
    { name: 'Montador', icon: Clock, query: 'montador' },
    { name: 'Diarista', icon: Clock, query: 'diarista' },
  ];

  const shortcuts = isLoggedIn ? loggedInShortcuts : loggedOutShortcuts;

  return (
    <div className="h-screen w-full overflow-hidden bg-white relative flex flex-col justify-center items-center">
      
      {/* Wave Background (Serras - Múltiplas camadas de verde) */}
      <div className="absolute bottom-0 left-0 w-full z-10 translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
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
        <form onSubmit={handleSearch} className="bg-white rounded-full p-2 flex items-center shadow-lg border border-slate-200 focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all mb-8 max-w-2xl mx-auto">
          <div className="pl-6 text-slate-400">
            <SearchIcon size={24} />
          </div>
          <input 
            type="text" 
            placeholder="Ex: Encanador, Eletricista, Limpeza..."
            className="flex-1 py-3 px-4 text-slate-800 text-lg focus:outline-none bg-transparent placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 md:px-10 py-3 rounded-full font-bold text-base transition-colors flex items-center gap-2">
            Buscar
          </button>
        </form>

        {/* Shortcuts / Chips */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-4">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wider whitespace-nowrap">
            {isLoggedIn ? "Buscados Recentemente:" : "Mais Buscados:"}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon;
              return (
                <button 
                  key={index}
                  onClick={() => navigate(`/search?category=${shortcut.query}`)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-full transition-all hover:scale-105 hover:border-slate-300"
                >
                  <Icon size={16} className="text-primary" />
                  <span className="font-medium text-sm">{shortcut.name}</span>
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
