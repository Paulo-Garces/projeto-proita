import { Home, Mail, Hash, Link as LinkIcon, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

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
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Home size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">proITA</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              O Guia dos Três Climas. Conectando os melhores profissionais de Itapipoca aos clientes que precisam de seus serviços.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Hash size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><LinkIcon size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Globe size={20} /></a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-sm">Explorar</h3>
            <ul className="space-y-3">
              <li><Link to="/search" className="text-slate-400 hover:text-primary transition-colors text-sm">Buscar Profissionais</Link></li>
              <li><Link to="/search?category=eletricista" className="text-slate-400 hover:text-primary transition-colors text-sm">Eletricistas</Link></li>
              <li><Link to="/search?category=encanador" className="text-slate-400 hover:text-primary transition-colors text-sm">Encanadores</Link></li>
              <li><Link to="/search?category=limpeza" className="text-slate-400 hover:text-primary transition-colors text-sm">Serviços de Limpeza</Link></li>
            </ul>
          </div>

          {/* Para Profissionais */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-sm">Para Profissionais</h3>
            <ul className="space-y-3">
              <li><Link to="/advertise" className="text-slate-400 hover:text-primary transition-colors text-sm">Anuncie seus Serviços</Link></li>
              <li><Link to="/auth" className="text-slate-400 hover:text-primary transition-colors text-sm">Criar Conta</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Planos e Preços</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Dicas de Perfil</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide uppercase text-sm">Suporte</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-2"><Mail size={16}/> contato@proita.com.br</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Central de Ajuda</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Termos de Uso</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Privacidade</a></li>
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
