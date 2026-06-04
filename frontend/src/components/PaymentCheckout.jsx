import React, { useState, useContext } from 'react';
import { X, ShieldCheck, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

/**
 * PaymentCheckout – Componente de pagamento reutilizável.
 *
 * Props:
 *  @param {string}   planId     – ID do plano no backend (ex: "basico_anual")
 *  @param {string}   planName   – Nome do plano (ex: "Plano Básico Anual")
 *  @param {string}   planPrice  – Preço formatado (ex: "35,90")
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
          planId,
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
          planId,
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
      link.download = `boleto_proita_${planId}_${boletoData.nossoNumero || 'gerado'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('[DOWNLOAD PDF] Erro:', err);
      alert('Não foi possível processar o download do PDF.');
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
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
        setSuccessMsg('Sucesso! Pagamento simulado e assinatura ativada com sucesso.');
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
    <div className="w-full font-sans">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row mx-auto">

        {/* ── Coluna Esquerda: Resumo ── */}
        <div className="bg-slate-900 text-white p-8 md:w-2/5 flex flex-col justify-between">
          <div>
            {/* Botão de voltar (se onClose for passado) */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
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
            <p className="text-slate-400 text-sm mb-8">Portal proITA</p>

            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-lg font-medium">{planName}</h3>
              <p className="text-sm text-slate-400 mt-1">{ctx.subtitle}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-slate-400 text-sm font-bold">R$</span>
                <span className="text-4xl font-bold">{planPrice}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            Ambiente 100% Seguro — Sem cobranças automáticas
          </div>
        </div>

        {/* ── Coluna Direita: Pagamento ── */}
        <div className="p-8 md:w-3/5">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Finalizar Pagamento</h2>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <span className="text-base leading-none">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <span className="text-base leading-none">✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Seletor de Método */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => handleMethodChange('pix')}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                paymentMethod === 'pix'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Pix <span className="text-xs font-normal">(Aprovação Imediata)</span>
            </button>
            <button
              onClick={() => handleMethodChange('boleto')}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                paymentMethod === 'boleto'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Boleto Bancário
            </button>
          </div>

          {/* Campo CPF/CNPJ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CPF / CNPJ do Titular <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              disabled={pixGenerated || boletoGenerated}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* Área Dinâmica: PIX */}
          {paymentMethod === 'pix' && (
            <div className="text-center">
              {!pixGenerated ? (
                <>
                  <div className="bg-slate-100 w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-4 border border-slate-200 border-dashed">
                    <span className="text-slate-400 text-sm">QR Code aparecerá aqui</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Abra o app do seu banco e escaneie o código, ou clique no botão abaixo para copiar a chave.
                  </p>
                  <button
                    onClick={handleGeneratePix}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? 'Gerando...' : 'Gerar PIX Copia e Cola'}
                  </button>
                </>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-left space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-bold text-emerald-800 mb-1">✅ PIX Gerado!</p>

                  {/* QR Code */}
                  <div className="flex justify-center my-2">
                    {pixData?.imagemQrcode ? (
                      <img
                        src={`data:image/png;base64,${pixData.imagemQrcode}`}
                        alt="QR Code PIX"
                        className="w-44 h-44 rounded-xl border border-emerald-200 p-2 bg-white shadow-xs"
                      />
                    ) : (
                      // Se for mock, gera QR code com a api qrserver para ficar dinâmico
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData?.pixCopiaECola || '')}`}
                        alt="QR Code PIX Simulado"
                        className="w-44 h-44 rounded-xl border border-emerald-200 p-2 bg-white shadow-xs"
                      />
                    )}
                  </div>

                  <p className="text-xs text-emerald-700">
                    Copie a chave abaixo e cole no app do seu banco. Após o pagamento, seu anúncio será ativado automaticamente.
                  </p>

                  <div className="flex items-stretch gap-2">
                    <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-700 break-all select-all flex-1">
                      {pixData?.pixCopiaECola}
                    </div>
                    <button
                      onClick={() => handleCopy(pixData?.pixCopiaECola || '')}
                      className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedText ? <Check size={14} /> : <Copy size={14} />}
                      {copiedText ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  {pixData?.mock && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                        🧪 Você está em Ambiente de Teste. Clique no botão abaixo para simular o pagamento e ativar seu plano instantaneamente:
                      </p>
                      <button
                        onClick={handleSimulateActivation}
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
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

          {/* Área Dinâmica: BOLETO */}
          {paymentMethod === 'boleto' && (
            <div>
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl mb-6 text-sm">
                <p>
                  <strong>Atenção:</strong> O pagamento via boleto pode levar até{' '}
                  <strong>1 dia útil</strong> para ser compensado. O seu anúncio será ativado
                  automaticamente após a confirmação do banco.
                </p>
              </div>

              {/* Nome Completo do Pagador */}
              {!boletoGenerated && (
                <div className="mb-6 animate-in fade-in duration-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo do Pagador <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nomePagador}
                    onChange={(e) => setNomePagador(e.target.value)}
                    placeholder="Nome completo do pagador"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              {!boletoGenerated ? (
                <button
                  onClick={handleGenerateBoleto}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Gerando...' : 'Gerar Boleto Registrado'}
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
                  <p className="text-sm font-bold text-blue-800 mb-1">✅ Boleto Gerado!</p>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-blue-100 pb-1.5">
                      <span>Vencimento:</span>
                      <span className="font-bold text-slate-700 font-sans">
                        {boletoData?.dataVencimento ? new Date(boletoData.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-blue-100 pb-1.5">
                      <span>Nosso Número:</span>
                      <span className="font-mono font-bold text-slate-700">{boletoData?.nossoNumero}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Valor:</span>
                      <span className="font-bold text-slate-700 font-sans">R$ {planPrice}</span>
                    </div>
                  </div>

                  <p className="text-xs text-blue-700">
                    Copie o código de barras abaixo para pagar no app do seu banco:
                  </p>

                  <div className="flex items-stretch gap-2">
                    <div className="bg-white border border-blue-200 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-700 break-all select-all flex-1">
                      {boletoData?.linhaDigitavel}
                    </div>
                    <button
                      onClick={() => handleCopy(boletoData?.linhaDigitavel || '')}
                      className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedText ? <Check size={14} /> : <Copy size={14} />}
                      {copiedText ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  {boletoData?.pdfBase64 && (
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 text-sm"
                    >
                      <span>📥 Baixar PDF do Boleto</span>
                    </button>
                  )}

                  {boletoData?.mock && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                        🧪 Você está em Ambiente de Teste. Clique no botão abaixo para simular o pagamento do boleto e ativar seu plano instantaneamente:
                      </p>
                      <button
                        onClick={handleSimulateActivation}
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
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
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;