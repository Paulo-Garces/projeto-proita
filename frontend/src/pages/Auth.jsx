import { useState, useContext, useEffect } from 'react';
import { Home, Lock, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Auth() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('mode') !== 'register';
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [isWhatsapp, setIsWhatsapp] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.search]);

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setTelefone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!isLogin && !acceptedTerms) {
      setErrorMsg("Você precisa aceitar os Termos de Uso e Políticas de Privacidade.");
      return;
    }

    if (isLogin) {
      // Login Real
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone, senha })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          login(data.token, data.user);
          navigate('/');
        } else {
          setErrorMsg(data.message || "Erro ao fazer login. Verifique suas credenciais.");
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
        setErrorMsg("Erro ao conectar com o servidor.");
      }
    } else {
      // Cadastro Real
      try {
        const response = await fetch(`${API_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            sobrenome,
            telefone,
            isWhatsapp,
            senha
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setShowSuccess(true);
          setNome('');
          setSobrenome('');
          setTelefone('');
          setSenha('');
          setIsWhatsapp(true);
          setAcceptedTerms(false);
        } else {
          setErrorMsg(data.message || "Erro ao cadastrar.");
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
        setErrorMsg("Erro ao conectar com o servidor.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
        {showSuccess ? (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Conta criada com sucesso!</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Sua conta foi registrada e agora você faz parte da melhor rede de profissionais de Itapipoca.
            </p>
            <button 
              onClick={() => {
                setShowSuccess(false);
                setIsLogin(true);
              }}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continuar para o Login
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <Link to="/" className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4">
                <Home size={32} />
              </Link>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isLogin ? 'Acesse o Guia dos Três Climas' : 'Junte-se à melhor rede de profissionais de Itapipoca'}
              </p>
            </div>

        {/* Google Auth Button - Oculto Temporariamente
        <div className="mt-8">
          <button className="w-full flex justify-center items-center py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-base font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition-all hover:shadow-md hover:border-slate-300">
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">Ou use seu telefone</span>
          </div>
        </div>
        */}

        {errorMsg && (
          <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="Seu nome" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="Seu sobrenome" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input type="tel" value={telefone} onChange={handleTelefoneChange} required className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="(88) 99999-9999" />
            </div>
            {!isLogin && (
              <div className="mt-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isWhatsapp" 
                  checked={isWhatsapp}
                  onChange={(e) => setIsWhatsapp(e.target.checked)}
                  className="w-4 h-4 text-primary bg-slate-50 border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor="isWhatsapp" className="text-sm text-slate-600 cursor-pointer">
                  Este número é WhatsApp?
                </label>
              </div>
            )}
          </div>



          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="••••••••" />
            </div>
          </div>

          {!isLogin && (
            <div className="flex items-start gap-2 mt-4">
              <input 
                type="checkbox" 
                id="acceptedTerms" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary bg-slate-50 border-slate-300 rounded focus:ring-primary shrink-0"
                required
              />
              <label htmlFor="acceptedTerms" className="text-sm text-slate-600">
                Li e concordo com os <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Políticas de Privacidade</a>.
              </label>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-end">
              <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover">Esqueceu a senha?</a>
            </div>
          )}

          <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all mt-2">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

            <div className="text-center mt-6">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-600 hover:text-primary font-medium transition-colors"
              >
                {isLogin ? 'Não tem uma conta? Criar Conta' : 'Já tem uma conta? Entrar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
