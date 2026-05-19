import { useState, useContext, useEffect } from 'react';
import { Home, Lock, Phone, CheckCircle, AlertCircle, Eye, EyeOff, X, ArrowLeft, Mail } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const [authView, setAuthView] = useState('default');
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [novaSenhaRecuperacao, setNovaSenhaRecuperacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showSupportMsg, setShowSupportMsg] = useState(false);

  // Estado do modal de conflito Google/Telefone
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);

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

  // ── Processa a credencial retornada pelo Google ──────────────
  const handleGoogleCredential = async (response) => {
    try {
      const credential = response.credential;

      // Decodifica o JWT do Google para extrair os dados do utilizador
      const payload = JSON.parse(atob(credential.split('.')[1]));
      console.log('[Google Auth] Dados recebidos do Google:', payload);

      const googleData = {
        email: payload.email,
        googleId: payload.sub,
        nome: payload.given_name || payload.name || 'Usuário',
        sobrenome: payload.family_name || '',
        profileImageUrl: payload.picture || null,
      };

      // POST para o backend com os dados do Google
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });

      const data = await res.json();
      console.log('[Google Auth] Resposta do servidor:', data);

      if (res.ok && data.success) {
        login(data.token, data.user);
        navigate('/');
      } else if (res.status === 409) {
        // Conflito: conta já existe com telefone
        setConflictData({ email: googleData.email, googleId: googleData.googleId });
        setShowConflictModal(true);
      } else {
        setErrorMsg(data.message || 'Erro ao autenticar com Google.');
      }
    } catch (error) {
      console.error('[Google Auth] Erro ao processar credencial:', error);
      setErrorMsg('Erro ao conectar com o Google. Tente novamente.');
    }
  };

  // ── Google Login via Identity Services SDK ───────────────────
  useEffect(() => {
    if (authView !== 'default') return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      try {
        if (typeof google === 'undefined' || !google.accounts) return false;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
        });
        const btn = document.getElementById('google-login-btn');
        if (btn) {
          btn.innerHTML = '';
          google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
        }
        return true;
      } catch (err) {
        console.error('[Google SDK] Erro na inicialização (ignorado):', err);
        return true; // retorna true para parar o retry — o erro é irrecuperável
      }
    };

    // Tenta inicializar; se o SDK ainda não carregou, tenta novamente após intervalos
    if (!initGoogle()) {
      const retryId = setInterval(() => {
        if (initGoogle()) clearInterval(retryId);
      }, 300);
      setTimeout(() => clearInterval(retryId), 5000);
    }
  }, [authView]);

  // ── Confirmar mesclagem de conta ────────────────────────────
  const handleConfirmMerge = async () => {
    if (!conflictData) return;
    try {
      // Reenvia para a rota principal do Google com flag de vinculação
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: conflictData.email,
          googleId: conflictData.googleId,
          nome: conflictData.nome || 'Usuário',
          sobrenome: conflictData.sobrenome || '',
        })
      });
      const data = await response.json();
      console.log('[Google Merge] Resposta:', data);
      if (response.ok && data.success) {
        login(data.token, data.user);
        setShowConflictModal(false);
        navigate('/');
      } else {
        setErrorMsg(data.message || 'Erro ao vincular contas.');
        setShowConflictModal(false);
      }
    } catch (error) {
      console.error("Erro ao mesclar contas:", error);
      setErrorMsg("Erro ao conectar com o servidor.");
      setShowConflictModal(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setShowSupportMsg(false);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: emailRecuperacao })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Erro ao processar resposta do servidor');
      }

      console.log('[Forgot Password] Status:', response.status, 'Data:', data);

      if (response.ok && data.success) {
        setAuthView('reset_password');
        setSuccessMsg(data.message || 'Código enviado! Verifique seu e-mail.');
      } else {
        // Qualquer erro (400 sem e-mail, 404 não encontrado, etc) → mostra caixa de suporte
        setShowSupportMsg(true);
      }
    } catch (error) {
      console.error('[Forgot Password] Erro:', error);
      setErrorMsg('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: emailRecuperacao, code: codigoRecuperacao, novaSenha: novaSenhaRecuperacao })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAuthView('default');
        setIsLogin(true);
        setSuccessMsg(data.message || 'Senha redefinida com sucesso! Faça login.');
        setEmailRecuperacao('');
        setCodigoRecuperacao('');
        setNovaSenhaRecuperacao('');
      } else {
        setErrorMsg(data.message || 'Erro ao redefinir a senha.');
      }
    } catch (error) {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Higieniza o telefone: remove máscara, mantém apenas dígitos
    const telefoneLimpo = telefone.replace(/\D/g, '');

    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      setErrorMsg("Informe um telefone válido com DDD.");
      return;
    }

    if (senha.length !== 6) {
      setErrorMsg("A senha deve conter exatamente 6 números.");
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setErrorMsg("Você precisa aceitar os Termos de Uso e Políticas de Privacidade.");
      return;
    }

    if (isLogin) {
      // ── LOGIN ──────────────────────────────────────────────
      try {
        console.log('[Login] Enviando:', { telefone, telefoneLimpo, senha: '***' });

        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone: telefone, telefoneLimpo: telefone.replace(/\D/g, ''), senha })
        });

        const data = await response.json();
        console.log('[Login] Resposta:', response.status, data);

        if (response.ok && data.success) {
          login(data.token, data.user);
          navigate('/');
        } else if (response.status === 409) {
          setConflictData({ email: data.email || telefone });
          setShowConflictModal(true);
        } else {
          setErrorMsg(data.message || "Erro ao fazer login. Verifique suas credenciais.");
        }
      } catch (error) {
        console.error("[Login] Erro na requisição:", error);
        setErrorMsg("Erro ao conectar com o servidor.");
      }
    } else {
      // ── CADASTRO ───────────────────────────────────────────
      try {
        const response = await fetch(`${API_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            sobrenome,
            telefone: telefoneLimpo,
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
          <div className="space-y-6">

            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {showSupportMsg && (
              <div className="bg-blue-50 text-blue-700 p-5 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5 text-blue-500" size={24} />
                  <div>
                    <h4 className="font-bold text-blue-900 text-base">E-mail não encontrado</h4>
                    <p className="text-sm mt-1 leading-relaxed text-blue-800">
                      Esta conta foi criada usando apenas o número de celular. Para sua segurança, entre em contato com nosso suporte para vincular um e-mail de recuperação.
                    </p>
                  </div>
                </div>
                <a href="mailto:suporte@proita.com.br?subject=Recuperação de Conta proITA" className="self-end bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                  Enviar e-mail para o Suporte
                </a>
              </div>
            )}

            {authView === 'forgot_password' ? (
              <div className="animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <button type="button" onClick={() => { setAuthView('default'); setErrorMsg(''); setSuccessMsg(''); setShowSupportMsg(false); }} className="inline-flex items-center justify-center p-3 bg-slate-100 text-slate-500 rounded-2xl mb-4 hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-3xl font-extrabold text-slate-900">Recuperar Senha</h2>
                  <p className="mt-2 text-sm text-slate-600">Digite seu e-mail para receber um código numérico de 6 dígitos.</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleForgotPassword}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail ou Telefone cadastrado</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input type="text" value={emailRecuperacao} onChange={(e) => setEmailRecuperacao(e.target.value)} required className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="seu@email.com ou (88) 99999-9999" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-70 transition-all mt-2">
                    {isSubmitting ? 'Enviando...' : 'Enviar Código'}
                  </button>
                </form>
              </div>
            ) : authView === 'reset_password' ? (
              <div className="animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900">Redefinir Senha</h2>
                  <p className="mt-2 text-sm text-slate-600">Insira o código recebido no e-mail e seu novo PIN.</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleResetPassword}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail ou Telefone</label>
                    <input type="text" value={emailRecuperacao} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código de Recuperação</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength="6" value={codigoRecuperacao} onChange={(e) => setCodigoRecuperacao(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base text-center tracking-widest font-bold" placeholder="000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                    <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength="6" value={novaSenhaRecuperacao} onChange={(e) => setNovaSenhaRecuperacao(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base text-center tracking-widest font-bold" placeholder="Digite seu novo PIN" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-70 transition-all mt-2">
                    {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-300">
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

            {/* ── Botão Entrar com Google ─────────────────────── */}
            <div>
              <div id="google-login-btn" className="w-full flex justify-center mt-2 mb-4"></div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">Ou use seu telefone</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>

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
                  <input type="tel" value={telefone} onChange={handleTelefoneChange} onKeyDown={(e) => { if (e.key === 'Enter') { handleSubmit(e); } }} required className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="(88) 99999-9999" />
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
                  <input type={showPassword ? 'text' : 'password'} inputMode="numeric" maxLength="6" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleSubmit(e); } }} required className="pl-10 pr-12 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base" placeholder="Digite seu PIN de 6 números" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                    Li e concordo com os <a href="/termos-de-uso" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e <a href="/privacidade" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Políticas de Privacidade</a>.
                  </label>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-end">
                  <button type="button" onClick={() => { setAuthView('forgot_password'); setErrorMsg(''); setSuccessMsg(''); setShowSupportMsg(false); }} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">Esqueceu a senha?</button>
                </div>
              )}

              <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all mt-2">
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => { setAuthView('default'); setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); setShowSupportMsg(false); }}
                className="text-sm text-slate-600 hover:text-primary font-medium transition-colors"
              >
                {isLogin ? 'Não tem uma conta? Criar Conta' : 'Já tem uma conta? Entrar'}
              </button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>

  {/* ── Modal de Conflito de Conta ──────────────────────── */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <button onClick={() => setShowConflictModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Conta já existente</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Identificamos que você já possui uma conta registrada{conflictData?.email ? ` (${conflictData.email})` : ''}. Deseja vincular seu acesso do Google a esta conta?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmMerge}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-colors"
              >
                Sim, vincular contas
              </button>
              <button
                onClick={() => setShowConflictModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
