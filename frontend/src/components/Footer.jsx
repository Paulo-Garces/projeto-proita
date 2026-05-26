import { Mail, Hash, Link as LinkIcon, Globe } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const isTrialExpired = user?.planStatus === 'DEGUSTACAO' && user?.trialEndsAt && new Date(user.trialEndsAt) < new Date();
  const hasActivePlan = isAuthenticated && (user?.planStatus === 'ATIVO' || (user?.planStatus === 'DEGUSTACAO' && !isTrialExpired));

  const handleAnuncieClick = (e) => {
    e?.preventDefault();
    if (user) {
      navigate('/dashboard/novo-anuncio');
    } else {
      navigate('/planos');
    }
  };

  if (location.pathname === '/') {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo-proita.svg" alt="proITA" className="h-10 object-contain drop-shadow-sm brightness-0 invert" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              O Guia dos Três Climas. Conectando os melhores profissionais de Itapipoca aos clientes que precisam de seus serviços.
            </p>
            <div className="flex gap-4">
              <button title="Filtrar postagens" className="text-slate-400 hover:text-white transition-colors"><Hash size={20} /></button>
              <button 
                title="Copiar link" 
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <LinkIcon size={20} />
              </button>
              <button title="Perfil Público" className="text-slate-400 hover:text-white transition-colors"><Globe size={20} /></button>
            </div>
          </div>

          {/* Coluna 2 — reservada (mantida vazia para preservar layout de 4 colunas) */}
          <div></div>

          {/* Para Profissionais */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-sm">Para Profissionais</h3>
            <ul className="space-y-3">
              <li><button onClick={handleAnuncieClick} className="text-slate-400 hover:text-primary transition-colors text-sm text-left">Anuncie seus Serviços</button></li>
              <li><Link to="/auth?mode=register" className="text-slate-400 hover:text-primary transition-colors text-sm">Criar Conta</Link></li>
              <li><Link to="/planos" className="text-slate-400 hover:text-primary transition-colors text-sm">Planos e Preços</Link></li>
              <li><Link to="/dicas" className="text-slate-400 hover:text-primary transition-colors text-sm">Dicas de Perfil</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-sm">Suporte</h3>
            <ul className="space-y-3">
              <li><Link to="/central-de-ajuda" className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2"><Mail size={16}/> contato@proita.com.br</Link></li>
              <li><Link to="/central-de-ajuda" className="text-slate-400 hover:text-primary transition-colors text-sm">Central de Ajuda</Link></li>
              <li><Link to="/termos-de-uso" className="text-slate-400 hover:text-primary transition-colors text-sm">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-slate-400 hover:text-primary transition-colors text-sm">Privacidade</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} proITA - Guia dos Três Climas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
