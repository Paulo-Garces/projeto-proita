'use strict';

/**
 * interService.js
 * ────────────────────────────────────────────────────────────────────────────
 * Motor de integração com a API V2 do Banco Inter (api.inter.co)
 *
 * Responsabilidades:
 *  1. Gerenciar autenticação OAuth 2.0 com mTLS (client_credentials)
 *  2. Manter cache do access_token com renovação automática antes do vencimento
 *  3. Expor métodos tipados para criar cobranças PIX e boletos
 *
 * Pré-requisitos:
 *  • Variáveis de ambiente (ver .env.example):
 *      INTER_CLIENT_ID         → Client ID gerado no portal Inter
 *      INTER_CLIENT_SECRET     → Client Secret gerado no portal Inter
 *      INTER_ACCOUNT_NUMBER    → Número da conta corrente (sem dígito)
 *      INTER_CERT_PATH         → Caminho absoluto ou relativo para o .crt
 *      INTER_KEY_PATH          → Caminho absoluto ou relativo para o .key
 *  • Arquivos de certificado em: backend/certs/
 *      inter_client.crt        → Certificado do cliente (X.509 PEM)
 *      inter_client.key        → Chave privada do certificado (PEM)
 *
 * IMPORTANTE SOBRE OS CERTIFICADOS:
 *  O Banco Inter exige autenticação mútua TLS (mTLS). Você deve baixar o par
 *  de certificados no Portal Inter Developer:
 *    https://developers.inter.co → Meus Aplicativos → [seu app] → Certificados
 *  Coloque os arquivos baixados dentro da pasta: backend/certs/
 *  Nunca faça commit desses arquivos — eles já estão no .gitignore.
 * ────────────────────────────────────────────────────────────────────────────
 */

const axios  = require('axios');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

// ── 1. Leitura de Configuração ────────────────────────────────────────────────

const INTER_BASE_URL    = 'https://cdpj.partners.bancointer.com.br';  // Produção
// const INTER_BASE_URL = 'https://cdpj.partners.uatinter.co';         // Homologação/sandbox

const CLIENT_ID         = process.env.INTER_CLIENT_ID;
const CLIENT_SECRET     = process.env.INTER_CLIENT_SECRET;
const ACCOUNT_NUMBER    = process.env.INTER_ACCOUNT_NUMBER;

// Caminhos padrão dos certificados (podem ser sobrescritos pelo .env)
const CERT_PATH = process.env.INTER_CERT_PATH
  || path.resolve(__dirname, '../certs/inter_client.crt');

const KEY_PATH  = process.env.INTER_KEY_PATH
  || path.resolve(__dirname, '../certs/inter_client.key');

// ── 2. Validação de Configuração na Inicialização ────────────────────────────

function validateConfig() {
  const missing = [];
  if (!CLIENT_ID)      missing.push('INTER_CLIENT_ID');
  if (!CLIENT_SECRET)  missing.push('INTER_CLIENT_SECRET');
  if (!ACCOUNT_NUMBER) missing.push('INTER_ACCOUNT_NUMBER');

  if (missing.length > 0) {
    console.warn(
      `[InterService] ⚠️  Variáveis de ambiente ausentes: ${missing.join(', ')}.\n` +
      `  O serviço de pagamentos Inter estará INATIVO até que sejam configuradas.`
    );
    return false;
  }

  if (!fs.existsSync(CERT_PATH)) {
    console.warn(
      `[InterService] ⚠️  Certificado não encontrado: ${CERT_PATH}\n` +
      `  Baixe o certificado no Portal Inter Developer e coloque em backend/certs/`
    );
    return false;
  }

  if (!fs.existsSync(KEY_PATH)) {
    console.warn(
      `[InterService] ⚠️  Chave privada não encontrada: ${KEY_PATH}\n` +
      `  Baixe o certificado no Portal Inter Developer e coloque em backend/certs/`
    );
    return false;
  }

  return true;
}

const isConfigured = validateConfig();

// ── 3. Agente HTTPS com mTLS ──────────────────────────────────────────────────
//
// O Banco Inter exige que CADA requisição (inclusive o token OAuth) seja feita
// com o certificado de cliente presentado no handshake TLS.
// O httpsAgent abaixo carrega os arquivos .crt e .key uma única vez em memória.

let httpsAgent = null;

function getHttpsAgent() {
  if (httpsAgent) return httpsAgent;

  if (!isConfigured) return null;

  try {
    httpsAgent = new https.Agent({
      cert: fs.readFileSync(CERT_PATH),
      key:  fs.readFileSync(KEY_PATH),
      rejectUnauthorized: true,   // NUNCA desabilitar em produção
    });
    console.log('[InterService] ✅ Agente mTLS carregado com sucesso.');
    return httpsAgent;
  } catch (err) {
    console.error('[InterService] ❌ Erro ao carregar certificados mTLS:', err.message);
    return null;
  }
}

// ── 4. Cache de Token OAuth 2.0 ───────────────────────────────────────────────
//
// Tokens OAuth do Inter têm validade de 3600s (1h) por padrão.
// Guardamos em memória e renovamos 60s antes de expirar para evitar
// requisições rejeitadas por token vencido.

const tokenCache = {
  accessToken:  null,
  expiresAt:    0,     // Unix timestamp (ms)
  scope:        null,
};

/**
 * Obtém um access_token válido.
 * Reutiliza o cache se ainda não estiver a 60s do vencimento.
 *
 * @param {string[]} scopes - Escopos necessários, ex: ['cob.write', 'cob.read']
 * @returns {Promise<string>} access_token
 */
async function getAccessToken(scopes = []) {
  const now = Date.now();
  const scopeStr = scopes.sort().join(' ');

  // Retorna cache se válido e com os mesmos escopos
  if (
    tokenCache.accessToken &&
    tokenCache.scope === scopeStr &&
    now < tokenCache.expiresAt - 60_000   // 60s de margem
  ) {
    return tokenCache.accessToken;
  }

  if (!isConfigured) {
    throw new Error('[InterService] Configuração incompleta. Verifique as variáveis de ambiente e os certificados.');
  }

  const agent = getHttpsAgent();
  if (!agent) {
    throw new Error('[InterService] Não foi possível criar o agente mTLS.');
  }

  console.log(`[InterService] 🔑 Solicitando novo token OAuth (escopos: ${scopeStr || 'padrão'})...`);

  try {
    const params = new URLSearchParams();
    params.append('client_id',     CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type',    'client_credentials');
    if (scopeStr) params.append('scope', scopeStr);

    const response = await axios.post(
      `${INTER_BASE_URL}/oauth/v2/token`,
      params.toString(),
      {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in, scope } = response.data;

    // Atualiza cache
    tokenCache.accessToken = access_token;
    tokenCache.expiresAt   = now + expires_in * 1000;
    tokenCache.scope       = scope || scopeStr;

    console.log(`[InterService] ✅ Token obtido. Expira em ${expires_in}s.`);
    return access_token;

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[InterService] ❌ Erro ao obter token OAuth:', detail);
    throw new Error(`Falha na autenticação Inter: ${JSON.stringify(detail)}`);
  }
}

// ── 5. Cliente Axios Configurado ─────────────────────────────────────────────

/**
 * Cria uma instância Axios já configurada com:
 *  - Base URL da API Inter
 *  - Agente mTLS
 *  - Header de autorização com token atual
 *  - Header de conta corrente
 *
 * @param {string[]} scopes
 * @returns {Promise<import('axios').AxiosInstance>}
 */
async function createInterClient(scopes) {
  const token = await getAccessToken(scopes);
  const agent = getHttpsAgent();

  return axios.create({
    baseURL:    INTER_BASE_URL,
    httpsAgent: agent,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-conta-corrente': ACCOUNT_NUMBER,
      'Content-Type':   'application/json',
    },
  });
}

// ── 6. Métodos de Pagamento ───────────────────────────────────────────────────

/**
 * Cria uma cobrança PIX imediata (API PIX V3 do Inter).
 *
 * @param {object} params
 * @param {string} params.cpfCnpj    - CPF (11 dígitos) ou CNPJ (14 dígitos) do pagador
 * @param {string} params.nome       - Nome do pagador
 * @param {number} params.valor      - Valor em reais (ex: 35.90)
 * @param {string} params.descricao  - Descrição da cobrança (ex: "Plano Básico Anual proITA")
 * @param {string} params.planId     - ID do plano para controle interno
 * @param {number} [params.expiracaoSegundos=86400] - Validade do QR Code em segundos
 *
 * @returns {Promise<object>} Objeto com { txid, pixCopiaECola, imagemQrcode, ... }
 */
async function criarCobrancaPix({ cpfCnpj, nome, valor, descricao, planId, expiracaoSegundos = 86400 }) {
  const client = await createInterClient(['cob.write', 'cob.read']);

  const payload = {
    calendario: {
      expiracao: expiracaoSegundos,
    },
    devedor: {
      // Remove caracteres não numéricos do CPF/CNPJ
      ...(cpfCnpj.replace(/\D/g, '').length === 11
        ? { cpf: cpfCnpj.replace(/\D/g, '') }
        : { cnpj: cpfCnpj.replace(/\D/g, '') }),
      nome,
    },
    valor: {
      original: valor.toFixed(2),
    },
    chave: process.env.INTER_PIX_KEY,  // Sua chave PIX cadastrada no Inter
    solicitacaoPagador: descricao,
    infoAdicionais: [
      { nome: 'Plano',   valor: planId },
      { nome: 'Sistema', valor: 'proITA' },
    ],
  };

  const response = await client.post('/pix/v2/cob', payload);
  return response.data;
}

/**
 * Consulta o status de uma cobrança PIX por txid.
 *
 * @param {string} txid
 * @returns {Promise<object>}
 */
async function consultarCobrancaPix(txid) {
  const client = await createInterClient(['cob.read']);
  const response = await client.get(`/pix/v2/cob/${txid}`);
  return response.data;
}

/**
 * Emite um boleto de cobrança (API Cobrança V3 do Inter).
 *
 * @param {object} params
 * @param {string} params.cpfCnpj      - CPF ou CNPJ do pagador (somente dígitos)
 * @param {string} params.nome         - Nome completo do pagador
 * @param {string} params.logradouro   - Endereço do pagador
 * @param {string} params.cidade       - Cidade do pagador
 * @param {string} params.uf           - UF do pagador (ex: "CE")
 * @param {string} params.cep          - CEP do pagador (somente dígitos)
 * @param {number} params.valor        - Valor em reais
 * @param {string} params.descricao    - Descrição do boleto
 * @param {string} params.planId       - ID do plano para controle interno
 * @param {number} [params.diasVencimento=3] - Dias até o vencimento
 *
 * @returns {Promise<object>} Objeto com { nossoNumero, codigoBarras, linhaDigitavel, ... }
 */
async function emitirBoleto({
  cpfCnpj,
  nome,
  logradouro,
  cidade,
  uf = 'CE',
  cep,
  valor,
  descricao,
  planId,
  diasVencimento = 3,
}) {
  const client = await createInterClient(['boleto-cobranca.write', 'boleto-cobranca.read']);

  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + diasVencimento);
  const dataVencimento = vencimento.toISOString().split('T')[0]; // YYYY-MM-DD

  const cpfCnpjNum = cpfCnpj.replace(/\D/g, '');

  const payload = {
    pagador: {
      cpfCnpj:    cpfCnpjNum,
      tipoPessoa: cpfCnpjNum.length === 11 ? 'FISICA' : 'JURIDICA',
      nome,
      endereco: logradouro || 'Não informado',
      cidade:   cidade     || 'Itapipoca',
      uf,
      cep:      (cep || '62500000').replace(/\D/g, ''),
    },
    moraDia: {
      tipo:       'ISENTO',
    },
    multa: {
      tipo:       'ISENTO',
    },
    desconto: {
      codigo:     'NAOTEMDESCONTO',
    },
    valor,
    dataVencimento,
    numDiasAgenda: diasVencimento + 30,  // Janela de pagamento após vencimento
    mensagem: {
      linha1: descricao,
      linha2: `Plano proITA: ${planId}`,
    },
  };

  const response = await client.post('/cobranca/v3/cobrancas', payload);
  return response.data;
}

/**
 * Obtém o PDF do boleto em base64.
 *
 * @param {string} nossoNumero - Retornado pelo emitirBoleto
 * @returns {Promise<string>} PDF em base64
 */
async function obterPdfBoleto(nossoNumero) {
  const client = await createInterClient(['boleto-cobranca.read']);
  const response = await client.get(`/cobranca/v3/cobrancas/${nossoNumero}/pdf`, {
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.data, 'binary').toString('base64');
}

// ── 7. Health Check do Serviço ────────────────────────────────────────────────

/**
 * Verifica se o serviço está configurado e operacional.
 * Útil para rotas de health check e debug.
 */
function getServiceStatus() {
  return {
    configured: isConfigured,
    certFound:  fs.existsSync(CERT_PATH),
    keyFound:   fs.existsSync(KEY_PATH),
    hasToken:   !!tokenCache.accessToken && Date.now() < tokenCache.expiresAt,
    certPath:   CERT_PATH,
    keyPath:    KEY_PATH,
  };
}

// ── Exportações ───────────────────────────────────────────────────────────────

module.exports = {
  getAccessToken,
  criarCobrancaPix,
  consultarCobrancaPix,
  emitirBoleto,
  obterPdfBoleto,
  getServiceStatus,
};
