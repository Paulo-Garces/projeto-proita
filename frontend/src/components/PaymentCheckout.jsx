import React, { useState, useContext } from 'react';
import { 
  X, 
  ShieldCheck, 
  ArrowLeft, 
  Copy, 
  Check, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

// Mapeamento oficial de planos
const PLANS = {
  basico_anual: { 
    id: 'basico_anual', 
    name: 'Plano Profissional Anual', 
    price: '35,90',
    description: 'Selo profissional verificado e portfólio completo.' 
  },
  basico_bienal: { 
    id: 'basico_bienal', 
    name: 'Plano Profissional Bienal', 
    price: '59,90',
    description: 'Selo profissional verificado e portfólio completo.' 
  },
  patrocinador_anual: { 
    id: 'patrocinador_anual', 
    name: 'Plano Patrocinador Anual', 
    price: '45,90',
    description: 'Destaque prioritário + revenda de espaço publicitário.' 
  },
  patrocinador_bienal: { 
    id: 'patrocinador_bienal', 
    name: 'Plano Patrocinador Bienal', 
    price: '79,90',
    description: 'Destaque prioritário + revenda de espaço publicitário.' 
  },
};

/**
 * PaymentCheckout – Componente de pagamento reutilizável.
 *
 * Props:
 *  @param {string}   planId     – ID do plano inicial (ex: "basico_anual")
 *  @param {string}   planName   – Nome do plano inicial
 *  @param {string}   planPrice  – Preço inicial formatado
 *  @param {string}   userStatus – Contexto do usuário: 'first_subscription' | 'trial_ending' | 'renewal'
 *  @param {function} onClose    – Callback para fechar/voltar (opcional)
 */
const PaymentCheckout = ({
  planId = 'basico_anual',
  planName = 'Plano Básico Anual',
  planPrice = '35,90',
  userStatus = 'first_subscription',
  onClose = null,
}) => {
  const { token, user, updateUser } = useContext(AuthContext);

  // Seleção dinâmica do plano
  const [selectedPlanId, setSelectedPlanId] = useState(planId);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cpf, setCpf] = useState('');
  const [pixGenerated, setPixGenerated] = useState(false);
  const [boletoGenerated, setBoletoGenerated] = useState(false);

  // Estados da API
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pixData, setPixData] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [nomePagador, setNomePagador] = useState(
    user ? `${user.nome} ${user.sobrenome || ''}`.trim() : ''
  );
  const [copiedText, setCopiedText] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Polling para checar status do pagamento PIX
  useEffect(() => {
    let intervalId = null;

    if (pixGenerated && pixData?.txid && !paymentConfirmed) {
      console.log(`[PIX Polling] Iniciando monitoramento para txid: ${pixData.txid}`);
      
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/payments/status/${pixData.txid}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.success && (data.status === 'CONCLUIDA' || data.status === 'PAGO')) {
              console.log('[PIX Polling] Pagamento confirmado com sucesso!');
              clearInterval(intervalId);
              intervalId = null;
              
              if (data.user) {
                updateUser(data.user);
              }
              setSuccessMsg('Pagamento Confirmado com Sucesso!');
              setPaymentConfirmed(true);
            }
          }
        } catch (err) {
          console.error('[PIX Polling] Erro ao verificar status:', err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        console.log('[PIX Polling] Limpando monitoramento...');
        clearInterval(intervalId);
      }
    };
  }, [pixGenerated, pixData, token, updateUser, paymentConfirmed]);

  // Obtém informações do plano selecionado ou fallback para as props iniciais
  const currentPlan = PLANS[selectedPlanId] || { id: planId, name: planName, price: planPrice };

  // Contexto textual baseado no userStatus
  const contextMessages = {
    first_subscription: {
      label: 'Primeira Assinatura',
      tagColor: 'bg-emerald-500',
      subtitle: 'Comece agora e ganhe 30 dias grátis de degustação.',
    },
    trial_ending: {
      label: 'Teste Encerrando',
      tagColor: 'bg-amber-500',
      subtitle: 'Seu período de degustação está acabando. Assine para continuar sem interrupção.',
    },
    renewal: {
      label: 'Renovação Anual',
      tagColor: 'bg-sky-500',
      subtitle: 'Renovação manual — sem cobranças automáticas no cartão.',
    },
  };

  const ctx = contextMessages[userStatus] || contextMessages.first_subscription;

  const formatCpf = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
    if (v.length > 6) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
    if (v.length > 3) return `${v.slice(0,3)}.${v.slice(3)}`;
    return v;
  };

  const handleCpfChange = (e) => setCpf(formatCpf(e.target.value));

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePlanChange = (newPlanId) => {
    setSelectedPlanId(newPlanId);
    setPixGenerated(false);
    setBoletoGenerated(false);
    setPixData(null);
    setBoletoData(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGeneratePix = async () => {
    if (!cpf.trim()) {
      setErrorMsg('Por favor, informe seu CPF ou CNPJ antes de gerar o PIX.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          cpfCnpj: cpf.replace(/\D/g, '')
        })
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
        setPixGenerated(true);
      } else {
        setErrorMsg(data.message || 'Erro ao gerar cobrança PIX. Verifique os dados fornecidos.');
      }
    } catch (err) {
      console.error('[GENERATE PIX] Erro:', err);
      setErrorMsg('Erro de conexão ao servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBoleto = async () => {
    if (!cpf.trim()) {
      setErrorMsg('Por favor, informe seu CPF ou CNPJ antes de gerar o Boleto.');
      return;
    }
    if (!nomePagador.trim() || nomePagador.trim().length < 3) {
      setErrorMsg('Por favor, informe o Nome Completo do pagador (mínimo 3 caracteres).');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/boleto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          cpfCnpj: cpf.replace(/\D/g, ''),
          nome: nomePagador
        })
      });
      const data = await res.json();
      if (data.success) {
        setBoletoData(data);
        setBoletoGenerated(true);
      } else {
        setErrorMsg(data.message || 'Erro ao gerar Boleto. Verifique os dados fornecidos.');
      }
    } catch (err) {
      console.error('[GENERATE BOLETO] Erro:', err);
      setErrorMsg('Erro de conexão ao servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!boletoData || !boletoData.pdfBase64) return;
    try {
      const byteCharacters = atob(boletoData.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `boleto_proita_${selectedPlanId}_${boletoData.nossoNumero || 'gerado'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('[DOWNLOAD PDF] Erro:', err);
      setErrorMsg('Não foi possível processar o download do PDF.');
    }
  };

  const handleCreditCardCheckout = async () => {
    if (!cpf.trim()) {
      setErrorMsg('Por favor, informe seu CPF ou CNPJ antes de prosseguir com o pagamento por Cartão.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/payments/credit-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          cpfCnpj: cpf.replace(/\D/g, '')
        })
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setErrorMsg(data.message || 'Erro ao gerar link de pagamento do cartão.');
      }
    } catch (err) {
      console.error('[CREDIT CARD CHECKOUT] Erro:', err);
      setErrorMsg('Erro de conexão ao servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateActivation = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/ads/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
        setSuccessMsg('Assinatura ativada e atualizada com sucesso no banco de dados.');
        setPaymentConfirmed(true);
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Erro ao simular ativação.');
      }
    } catch (err) {
      console.error('[SIMULATE PAYMENT] Erro:', err);
      setErrorMsg('Erro de conexão ao simular ativação.');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    setPixGenerated(false);
    setBoletoGenerated(false);
    setErrorMsg('');
  };

  return (
    <div className="w-full font-sans antialiased text-slate-800">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col md:flex-row mx-auto">

        {/* ── Coluna Esquerda: Resumo do Plano (Dinâmico) ── */}
        <div className="bg-slate-900 text-white p-8 md:w-2/5 flex flex-col justify-between">
          <div>
            {/* Botão de voltar */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group cursor-pointer"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Voltar
              </button>
            )}

            <div className="flex items-center gap-2 mb-1">
              <span className={`text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${ctx.tagColor}`}>
                {ctx.label}
              </span>
            </div>

            <h2 className="text-xl font-semibold mt-3 mb-1">Resumo da Assinatura</h2>
            <p className="text-slate-400 text-sm mb-6">Portal proITA</p>

            {/* Painel do Plano com Seleção Dinâmica */}
            <div className="bg-slate-800/85 rounded-xl p-5 border border-slate-700/60 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Escolha o Plano
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  disabled={pixGenerated || boletoGenerated || loading}
                  className="w-full bg-slate-900 text-white rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="basico_anual">Profissional Anual (R$ 35,90/ano)</option>
                  <option value="basico_bienal">Profissional Bienal (R$ 59,90/2 anos)</option>
                  <option value="patrocinador_anual">Patrocinador Anual (R$ 45,90/ano)</option>
                  <option value="patrocinador_bienal">Patrocinador Bienal (R$ 79,90/2 anos)</option>
                </select>
              </div>

              <div className="h-px bg-slate-700/50"></div>

              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{currentPlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{ctx.subtitle}</p>
                <div className="mt-3.5 flex items-baseline gap-1">
                  <span className="text-slate-400 text-xs font-bold">R$</span>
                  <span className="text-3xl font-extrabold text-white">{currentPlan.price}</span>
                  <span className="text-slate-400 text-[10px] ml-1 font-bold">
                    {selectedPlanId.endsWith('bienal') ? '/2 anos' : '/ano'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
            Ambiente 100% Seguro — Sem cobranças automáticas
          </div>
        </div>

        {/* ── Coluna Direita: Detalhes do Pagamento ── */}
        <div className="p-8 md:w-3/5 flex flex-col justify-center">
          {paymentConfirmed ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-1">
                <CheckCircle2 className="text-emerald-600 animate-bounce" size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Pagamento Confirmado com Sucesso!</h3>
              <p className="text-sm text-slate-600 max-w-md">
                Sua assinatura foi ativada de imediato. Todos os recursos premium e destaques do proITA já estão disponíveis para a sua conta!
              </p>
              
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status do Plano</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">Ativo</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Plano Ativado</span>
                  <span className="font-bold text-slate-800">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Valor Pago</span>
                  <span className="font-extrabold text-indigo-600">R$ {currentPlan.price}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Ir para o Painel
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Finalizar Pagamento</h2>

              {/* Mensagem de Erro (Sem emojis, usando AlertTriangle) */}
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Mensagem de Sucesso (Sem emojis, usando CheckCircle2) */}
              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Seletor de Método de Pagamento (Visual Clean e Coeso) */}
              <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-4 mb-6">
                <button
                  onClick={() => handleMethodChange('pix')}
                  className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-600/5'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Pix <span className="text-[10px] font-normal block mt-0.5 whitespace-normal sm:whitespace-nowrap">(Aprovação Imediata)</span>
                </button>
                <button
                  onClick={() => handleMethodChange('boleto')}
                  className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer ${
                    paymentMethod === 'boleto'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-600/5'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Boleto <span className="text-[10px] font-normal block mt-0.5 whitespace-normal sm:whitespace-nowrap">(1 dia útil)</span>
                </button>
                <button
                  onClick={() => handleMethodChange('credit-card')}
                  className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl border font-bold text-xs transition-all duration-200 cursor-pointer ${
                    paymentMethod === 'credit-card'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-700 ring-2 ring-emerald-600/5'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Cartão <span className="text-[10px] font-normal block mt-0.5 whitespace-normal sm:whitespace-nowrap">(Ambiente Seguro)</span>
                </button>
              </div>

              {/* Campo CPF/CNPJ do Titular */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  CPF / CNPJ do Titular <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  disabled={pixGenerated || boletoGenerated}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 text-sm"
                />
              </div>
              <hr className="border-slate-100 mb-6" />

              {/* Área: PIX */}
              {paymentMethod === 'pix' && (
                <div className="text-center">
                  {!pixGenerated ? (
                    <>
                      <div className="bg-slate-50 w-44 h-44 mx-auto rounded-2xl flex items-center justify-center mb-4 border border-slate-200 border-dashed">
                        <span className="text-slate-400 text-[11px] font-bold">QR Code PIX</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
                        Clique no botão abaixo para gerar a cobrança. Você poderá pagar lendo o QR Code ou copiando o código PIX.
                      </p>
                      <button
                        onClick={handleGeneratePix}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Gerando cobrança...' : 'Gerar Chave PIX'}
                      </button>
                    </>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/85 rounded-2xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <CheckCircle2 className="text-indigo-600 shrink-0" size={18} />
                        <span>Pix Gerado com Sucesso</span>
                      </div>

                      {/* QR Code Container */}
                      <div className="flex justify-center my-2">
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-center">
                          {pixData?.imagemQrcode ? (
                            <img
                              src={`data:image/png;base64,${pixData.imagemQrcode}`}
                              alt="QR Code PIX"
                              className="w-40 h-40 object-contain"
                            />
                          ) : (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixData?.pixCopiaECola || '')}`}
                              alt="QR Code PIX Simulado"
                              className="w-40 h-40 object-contain"
                            />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        Copie a chave Pix abaixo e pague através do aplicativo de faturamento ou banco de sua preferência. A compensação ocorre em instantes.
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                        <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 font-mono text-xs text-slate-700 break-all select-all flex-1 min-w-0 w-full">
                          {pixData?.pixCopiaECola}
                        </div>
                        <button
                          onClick={() => handleCopy(pixData?.pixCopiaECola || '')}
                          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          {copiedText ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Área: BOLETO */}
              {paymentMethod === 'boleto' && (
                <div>
                  {/* Box de Informações */}
                  {!boletoGenerated && (
                    <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl mb-5 text-xs leading-relaxed">
                      <strong>Compensação Bancária:</strong> Pagamentos em boleto levam cerca de 1 dia útil para processamento. O plano será ativado imediatamente após o banco repassar a liquidação.
                    </div>
                  )}

                  {!boletoGenerated ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Nome Completo do Pagador <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={nomePagador}
                          onChange={(e) => setNomePagador(e.target.value)}
                          placeholder="Informe o nome impresso no boleto"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <button
                        onClick={handleGenerateBoleto}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Gerando boleto...' : 'Gerar Boleto de Cobrança'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <CheckCircle2 className="text-indigo-600 shrink-0" size={18} />
                        <span>Boleto Gerado com Sucesso</span>
                      </div>

                      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-xs pb-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Nosso Número</span>
                          <span className="font-mono text-slate-700">{boletoData?.nossoNumero}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Vencimento</span>
                          <span className="font-bold text-slate-800">
                            {boletoData?.dataVencimento
                              ? new Date(boletoData.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                              : ''}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        Copie a linha digitável abaixo ou faça o download do arquivo em formato PDF para concluir seu pagamento no seu banco.
                      </p>

                      {/* Linha Digitável e Cópia */}
                      <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                        <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 font-mono text-xs text-slate-700 break-all select-all flex-1 min-w-0 w-full">
                          {boletoData?.linhaDigitavel}
                        </div>
                        <button
                          onClick={() => handleCopy(boletoData?.linhaDigitavel || '')}
                          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          {copiedText ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>

                      {/* Ação Primária: Baixar Boleto (PDF) */}
                      {boletoData?.pdfBase64 && (
                        <button
                          onClick={handleDownloadPdf}
                          className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
                        >
                          <Download size={16} />
                          <span>Baixar Boleto (PDF)</span>
                        </button>
                      )}

                      {/* Banner de Ambiente de Teste */}
                      {boletoData?.mock && (
                        <div className="mt-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-3">
                          <div className="flex items-start gap-2.5">
                            <Sparkles className="text-amber-500 animate-pulse mt-0.5 shrink-0" size={16} />
                            <p className="text-[11px] text-amber-800 font-bold leading-normal">
                              Você está em Ambiente de Teste. Clique no botão abaixo para simular o pagamento do boleto e ativar seu plano instantaneamente.
                            </p>
                          </div>
                          <button
                            onClick={handleSimulateActivation}
                            disabled={loading}
                            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            Confirmar Pagamento Simulado
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Área: CARTÃO DE CRÉDITO */}
              {paymentMethod === 'credit-card' && (
                <div className="text-center animate-in fade-in duration-300">
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 p-6 rounded-2xl mb-6 text-sm leading-relaxed flex flex-col items-center gap-4">
                    <div className="bg-emerald-100/50 p-3 rounded-full">
                      <ShieldCheck size={40} className="text-emerald-500" />
                    </div>
                    <div>
                      <strong className="text-slate-800 text-base">Ambiente 100% Seguro</strong>
                      <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
                        Você será redirecionado para o ambiente seguro da <strong>InfinitePay</strong> para concluir seu pagamento. 
                        Nenhum dado do seu cartão será armazenado em nossos servidores.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreditCardCheckout}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Redirecionando para pagamento...' : 'Pagar com Cartão (Seguro)'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;