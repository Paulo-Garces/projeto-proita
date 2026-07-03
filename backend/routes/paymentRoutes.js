'use strict';

/**
 * paymentRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * Rotas de pagamento do proITA via Banco Inter API V2
 *
 * Endpoints:
 *  POST /api/payments/pix      → Gera cobrança PIX (QR Code + Copia e Cola)
 *  POST /api/payments/boleto   → Emite boleto bancário registrado
 *  GET  /api/payments/status   → Health check da integração Inter
 *  GET  /api/payments/pix/:txid → Consulta status de cobrança PIX
 * ────────────────────────────────────────────────────────────────────────────
 */

const express        = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const interService   = require('../services/interService');
const sendEmail      = require('../utils/sendEmail');

module.exports = (prisma) => {
  const router = express.Router();

  // ── Mapa de Planos → Valores ──────────────────────────────────────────────────
  // Centralizado aqui para evitar manipulação de preço via cliente
  const PLAN_PRICES = {
    basico_anual:        35.90,
    basico_bienal:       59.90,
    patrocinador_anual:  45.90,
    patrocinador_bienal: 79.90,
  };

  const PLAN_LABELS = {
    basico_anual:        'Plano Básico Anual proITA',
    basico_bienal:       'Plano Básico Bienal proITA',
    patrocinador_anual:  'Plano Patrocinador Anual proITA',
    patrocinador_bienal: 'Plano Patrocinador Bienal proITA',
  };

  // ── Helper: Detecta se está em modo mock ─────────────────────────────────────
  const IS_MOCK = process.env.INTER_MOCK_MODE === 'true' || !interService.getServiceStatus().configured;

  if (IS_MOCK) {
    console.log('[PaymentRoutes] 🧪 Modo MOCK ativo — nenhuma chamada real ao Banco Inter será feita.');
  } else {
    console.log('[PaymentRoutes] 🏦 Modo PRODUÇÃO ativo — chamadas reais ao Banco Inter habilitadas.');
  }

  // ── Helper: Valida CPF/CNPJ (formato mínimo) ─────────────────────────────────
  function validarCpfCnpj(valor) {
    const nums = (valor || '').replace(/\D/g, '');
    return nums.length === 11 || nums.length === 14;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 1: POST /api/payments/pix
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/pix', authMiddleware, async (req, res) => {
    try {
      const { planId, cpfCnpj } = req.body;

      // ── Validações ────────────────────────────────────────────────────────────
      if (!planId || !PLAN_PRICES[planId]) {
        return res.status(400).json({
          success: false,
          message: `Plano inválido. Opções válidas: ${Object.keys(PLAN_PRICES).join(', ')}`,
        });
      }

      if (!cpfCnpj || !validarCpfCnpj(cpfCnpj)) {
        return res.status(400).json({
          success: false,
          message: 'CPF ou CNPJ inválido. Informe somente os números (11 para CPF, 14 para CNPJ).',
        });
      }

      const valor    = PLAN_PRICES[planId];
      const descricao = PLAN_LABELS[planId];
      const nomeUsuario = req.user?.nome || 'Cliente proITA';
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

      // ── Modo Mock ─────────────────────────────────────────────────────────────
      if (IS_MOCK) {
        console.log(`[PIX Mock] Gerando cobrança mock para planId="${planId}", valor=R$${valor}`);
        const txid = `MOCK_${Date.now()}`;

        // Salva dados de transação pendente no usuário
        try {
          await prisma.user.update({
            where: { id: req.user.id },
            data: {
              cpfCnpj: cleanCpfCnpj,
              pendingTxid: txid,
              pendingPlanId: planId,
              pendingNossoNumero: null
            }
          });
        } catch (dbErr) {
          console.error('[PIX Mock DB] Erro ao salvar transação mock no usuário:', dbErr.message);
        }

        return res.status(200).json({
          success: true,
          mock:    true,
          txid,
          pixCopiaECola: '00020126580014br.gov.bcb.pix0136proita-chave-pix-placeholder5204000053039865802BR5925proITA Itapipoca6009Itapipoca62070503***6304ABCD',
          imagemQrcode:  null,
          valor,
          descricao,
          expiracao: 86400,     // 24h
          mensagem: '⚠️ Modo de desenvolvimento — nenhuma cobrança real foi criada.',
        });
      }

      // ── Produção: chamada real ao Inter ───────────────────────────────────────
      console.log(`[PIX] Criando cobrança para planId="${planId}", cpf/cnpj="${cpfCnpj.replace(/\D/g, '').slice(0, 3)}***"`);

      const resultado = await interService.criarCobrancaPix({
        cpfCnpj,
        nome:     nomeUsuario,
        valor,
        descricao,
        planId,
        expiracaoSegundos: 86400,  // 24h
      });

      // Salva dados de transação pendente no usuário
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            cpfCnpj: cleanCpfCnpj,
            pendingTxid: resultado.txid,
            pendingPlanId: planId,
            pendingNossoNumero: null
          }
        });
      } catch (dbErr) {
        console.error('[PIX DB] Erro ao salvar transação pendente no usuário:', dbErr.message);
      }

      return res.status(201).json({
        success:       true,
        txid:          resultado.txid,
        pixCopiaECola: resultado.pixCopiaECola,
        imagemQrcode:  resultado.imagemQrcode || null,
        valor,
        descricao,
        expiracao:     resultado.calendario?.expiracao || 86400,
      });

    } catch (err) {
      console.error('[POST /api/payments/pix] Erro:', err.message);
      return res.status(502).json({
        success: false,
        message: 'Erro ao gerar cobrança PIX. Tente novamente em instantes.',
        detail:  process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 2: POST /api/payments/boleto
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/boleto', authMiddleware, async (req, res) => {
    try {
      const {
        planId,
        cpfCnpj,
        nome,
        logradouro,
        cidade = 'Itapipoca',
        uf     = 'CE',
        cep    = '62500-000',
      } = req.body;

      // ── Validações ────────────────────────────────────────────────────────────
      if (!planId || !PLAN_PRICES[planId]) {
        return res.status(400).json({
          success: false,
          message: `Plano inválido. Opções válidas: ${Object.keys(PLAN_PRICES).join(', ')}`,
        });
      }

      if (!cpfCnpj || !validarCpfCnpj(cpfCnpj)) {
        return res.status(400).json({
          success: false,
          message: 'CPF ou CNPJ inválido.',
        });
      }

      if (!nome || nome.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Nome do pagador é obrigatório (mínimo 3 caracteres).',
        });
      }

      const valor     = PLAN_PRICES[planId];
      const descricao = PLAN_LABELS[planId];
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

      // Vencimento = hoje + 3 dias úteis
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 3);
      const dataVencimento = vencimento.toISOString().split('T')[0];

      // ── Modo Mock ─────────────────────────────────────────────────────────────
      if (IS_MOCK) {
        console.log(`[Boleto Mock] Gerando boleto mock para planId="${planId}", valor=R$${valor}`);
        const nossoNumero = `MOCK${Date.now()}`;

        // Salva dados de transação pendente no usuário
        try {
          await prisma.user.update({
            where: { id: req.user.id },
            data: {
              cpfCnpj: cleanCpfCnpj,
              pendingNossoNumero: nossoNumero,
              pendingPlanId: planId,
              pendingTxid: null
            }
          });
        } catch (dbErr) {
          console.error('[Boleto Mock DB] Erro ao salvar transação mock no usuário:', dbErr.message);
        }

        return res.status(200).json({
          success:        true,
          mock:           true,
          nossoNumero,
          codigoBarras:   '00190.00009 02148.830001 83600.701103 7 00000000003590',
          linhaDigitavel: '00190.00009 02148.830001 83600.701103 7 00000000003590',
          valor,
          dataVencimento,
          pdfBase64:      'JVBERi0xLjQKMSAwIG9iagogIDw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqCiAgPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCiAgPDwvTGVuZ3RoIDU5Pj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgogNzAgNzAwIFRkCiAoQm9sZXRvIFByb0lUQSAtIFNpbXVsYWRvKSBUagogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIGYgCjAwMDAwMDAyMDAgMDAwMDAgbiAKdHJhaWxlcgogIDw8L1NpemUgNS9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCiAyOTYKJSVFT0Y=',
          mensagem:       '⚠️ Modo de desenvolvimento — nenhum boleto real foi emitido.',
        });
      }

      // ── Produção: chamada real ao Inter ───────────────────────────────────────
      console.log(`[Boleto] Emitindo boleto para planId="${planId}", cpf/cnpj="${cpfCnpj.replace(/\D/g, '').slice(0, 3)}***"`);

      const boleto = await interService.emitirBoleto({
        cpfCnpj,
        nome:       nome.trim(),
        logradouro: logradouro || 'Não informado',
        cidade,
        uf,
        cep,
        valor,
        descricao,
        planId,
        diasVencimento: 3,
      });

      // Salva dados de transação pendente no usuário
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            cpfCnpj: cleanCpfCnpj,
            pendingNossoNumero: boleto.nossoNumero,
            pendingPlanId: planId,
            pendingTxid: null
          }
        });
      } catch (dbErr) {
        console.error('[Boleto DB] Erro ao salvar transação pendente no usuário:', dbErr.message);
      }

      // Busca o PDF (operação separada, pode falhar sem invalidar o boleto)
      let pdfBase64 = null;
      try {
        pdfBase64 = await interService.obterPdfBoleto(boleto.nossoNumero);
      } catch (pdfErr) {
        console.warn('[Boleto] Não foi possível obter o PDF:', pdfErr.message);
      }

      return res.status(201).json({
        success:        true,
        nossoNumero:    boleto.nossoNumero,
        codigoBarras:   boleto.codigoBarras,
        linhaDigitavel: boleto.linhaDigitavel,
        valor,
        dataVencimento,
        pdfBase64,
      });

    } catch (err) {
      console.error('[POST /api/payments/boleto] Erro:', err.message);
      return res.status(502).json({
        success: false,
        message: 'Erro ao emitir boleto. Tente novamente em instantes.',
        detail:  process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 3: GET /api/payments/status  (sem auth — útil para monitoramento)
  // ──────────────────────────────────────────────────────────────────────────────
  router.get('/status', (req, res) => {
    const status = interService.getServiceStatus();
    return res.status(200).json({
      success:    true,
      mockMode:   IS_MOCK,
      inter:      status,
      planos:     PLAN_PRICES,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 4: GET /api/payments/pix/:txid  (consulta status de cobrança PIX)
  // ──────────────────────────────────────────────────────────────────────────────
  router.get('/pix/:txid', authMiddleware, async (req, res) => {
    try {
      const { txid } = req.params;

      if (IS_MOCK) {
        return res.status(200).json({
          success: true,
          mock:    true,
          txid,
          status:  'ATIVA',
          mensagem: '⚠️ Modo mock — status simulado.',
        });
      }

      const cobranca = await interService.consultarCobrancaPix(txid);
      return res.status(200).json({ success: true, ...cobranca });

    } catch (err) {
      console.error('[GET /api/payments/pix/:txid] Erro:', err.message);
      return res.status(502).json({
        success: false,
        message: 'Erro ao consultar cobrança PIX.',
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 4b: GET /api/payments/status/:id  (consulta status de cobrança PIX/Boleto e sincroniza)
  // ──────────────────────────────────────────────────────────────────────────────
  router.get('/status/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Busca o usuário atual no banco local
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });

      if (IS_MOCK) {
        // Modo mock: se o plano já foi ativado, consideramos pago
        if (user && user.planStatus !== 'INATIVO') {
          return res.status(200).json({
            success: true,
            status: 'CONCLUIDA',
            planStatus: user.planStatus,
            user
          });
        }
        return res.status(200).json({
          success: true,
          status: 'ATIVA',
          message: 'Aguardando simulação de ativação de pagamento no modo mock.'
        });
      }

      // 2. Produção: consulta no Inter
      try {
        const cobranca = await interService.consultarCobrancaPix(id);

        if (cobranca && (cobranca.status === 'CONCLUIDA' || cobranca.status === 'PAGO')) {
          // Ativa o plano se a transação do usuário for a mesma e ainda estiver pendente
          if (user && user.pendingTxid === id) {
            let planStatus = 'ATIVO';
            let durationDays = 365;
            let planType = 'PRO_ANUAL';

            if (user.pendingPlanId) {
              if (user.pendingPlanId.includes('basico')) {
                planStatus = 'BASICO';
              }
              if (user.pendingPlanId.includes('bienal')) {
                durationDays = 730;
              }
              if (user.pendingPlanId === 'basico_anual') {
                planType = 'PRO_ANUAL';
              } else if (user.pendingPlanId === 'basico_bienal') {
                planType = 'PRO_BIENAL';
              } else if (user.pendingPlanId === 'patrocinador_anual') {
                planType = 'PATROCINADOR_ANUAL';
              } else if (user.pendingPlanId === 'patrocinador_bienal') {
                planType = 'PATROCINADOR_BIENAL';
              }
            }

            // Cálculo de assinatura cumulativa
            let baseDate = new Date();
            if ((user.planStatus === 'ATIVO' || user.planStatus === 'BASICO') && user.subscriptionEndsAt && user.subscriptionEndsAt > baseDate) {
              baseDate = new Date(user.subscriptionEndsAt);
            }
            const subscriptionEndsAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

            const updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                planStatus,
                subscriptionEndsAt,
                planType,
                trialEndsAt: null,
                pendingTxid: null,
                pendingPlanId: null,
                pendingNossoNumero: null
              }
            });

            return res.status(200).json({
              success: true,
              status: 'CONCLUIDA',
              planStatus,
              user: updatedUser
            });
          }
        }

        return res.status(200).json({
          success: true,
          status: cobranca.status,
          cobranca
        });
      } catch (interErr) {
        console.error(`[GET /api/payments/status/:id] Falha ao consultar Inter:`, interErr.message);

        // Fallback de segurança: se o plano local já estiver ativo de alguma forma, retorna sucesso
        if (user && user.planStatus !== 'INATIVO' && user.pendingTxid !== id) {
          return res.status(200).json({
            success: true,
            status: 'CONCLUIDA',
            planStatus: user.planStatus,
            user
          });
        }

        throw interErr;
      }
    } catch (err) {
      console.error('[GET /api/payments/status/:id] Erro:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao consultar status da cobrança.',
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA 5: POST /api/payments/credit-card
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/credit-card', authMiddleware, async (req, res) => {
    try {
      const { planId, cpfCnpj } = req.body;

      if (!planId || !PLAN_PRICES[planId]) {
        return res.status(400).json({
          success: false,
          message: `Plano inválido. Opções válidas: ${Object.keys(PLAN_PRICES).join(', ')}`,
        });
      }

      if (!cpfCnpj || !validarCpfCnpj(cpfCnpj)) {
        return res.status(400).json({
          success: false,
          message: 'CPF ou CNPJ inválido. Informe somente os números (11 para CPF, 14 para CNPJ).',
        });
      }

      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
      const valorCentavos = Math.round(PLAN_PRICES[planId] * 100);
      const descricao = PLAN_LABELS[planId];
      const handle = process.env.INFINITEPAY_HANDLE;

      if (!handle) {
         console.error('[Credit Card] INFINITEPAY_HANDLE não configurado no .env');
         return res.status(500).json({ success: false, message: 'Configuração de pagamento incompleta.' });
      }

      const order_nsu = `CC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Salva dados de transação pendente no usuário
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            cpfCnpj: cleanCpfCnpj,
            pendingTxid: order_nsu,
            pendingPlanId: planId,
          }
        });
      } catch (dbErr) {
        console.error('[Credit Card DB] Erro ao salvar transação pendente no usuário:', dbErr.message);
      }

      const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`;

      const payload = {
        handle,
        items: [
          {
            quantity: Number(1),
            price: Number(valorCentavos),
            description: String(descricao)
          }
        ],
        order_nsu,
        redirect_url,
        callback_url: `${process.env.API_URL}/api/webhooks/infinitepay`,
        metadata: {
          webhook_url: `${process.env.API_URL}/api/webhooks/infinitepay`
        }
      };

      console.log(`[Credit Card] Solicitando link de pagamento para planId="${planId}", valor=${valorCentavos} centavos`);

      const response = await fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.url) {
         return res.status(200).json({
            success: true,
            redirectUrl: data.url,
            order_nsu: order_nsu
         });
      } else {
         console.error('[Credit Card] Erro da InfinitePay:', data);
         return res.status(400).json({
            success: false,
            message: 'Não foi possível gerar o link de pagamento. Tente novamente.',
         });
      }

    } catch (err) {
      console.error('[POST /api/payments/credit-card] Erro:', err.message);
      return res.status(502).json({
        success: false,
        message: 'Erro ao processar pagamento com cartão.',
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // ROTA: POST /api/payments/nfe-request
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/nfe-request', authMiddleware, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'O e-mail para envio é obrigatório.'
        });
      }

      // Validação básica de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de e-mail inválido.'
        });
      }

      // Cria a solicitação no banco
      const nfeRequest = await prisma.nfeRequest.create({
        data: {
          userId: req.user.id,
          email: email,
          status: 'PENDENTE'
        }
      });

      // Busca dados completos do usuário e do anúncio para o e-mail de alerta
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            profiles: {
              take: 1
            }
          }
        });

        if (user) {
          const userName = `${user.nome} ${user.sobrenome || ''}`.trim();
          const userCpfCnpj = user.cpfCnpj || 'Não informado / Não cadastrado';
          const userEmail = user.email || user.telefone || 'Sem e-mail';
          const referenceCode = user.profiles[0]?.referenceCode || `PRO-${user.id.substring(0, 6).toUpperCase()}`;

          const emailSubject = `[NFS-e] Nova solicitacao de Nota Fiscal Eletronica - proITA (${referenceCode})`;
          const emailText = `
Olá equipe proITA,

Uma nova solicitação de Nota Fiscal Eletrônica (NFS-e) foi gerada pelo Anunciante.

Dados da Conta proITA:
- Nome: ${userName}
- E-mail/Contato da Conta: ${userEmail}
- CPF/CNPJ: ${userCpfCnpj}
- Código do Anúncio (Referência): ${referenceCode}

Dados para Envio da Nota:
- E-mail de Destino solicitado: ${email}

Por favor, faça a emissão no portal municipal de Itapipoca e envie o arquivo para o e-mail de destino em até 5 dias úteis.

Atenciosamente,
Plataforma proITA
          `.trim();

          const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Solicitação de NFS-e Recebida</h2>
              <p style="margin: 10px 0;"><strong>Nome do Usuário:</strong> ${userName}</p>
              <p style="margin: 10px 0;"><strong>CPF/CNPJ:</strong> ${userCpfCnpj}</p>
              <p style="margin: 10px 0;"><strong>E-mail de Cadastro:</strong> ${userEmail}</p>
              <p style="margin: 10px 0;"><strong>Código de Referência:</strong> ${referenceCode}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="margin: 10px 0; font-size: 15px;"><strong>E-mail de destino preenchido no modal:</strong> <a href="mailto:${email}" style="color: #2563eb; font-weight: bold;">${email}</a></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 15px;">
                Por favor, efetue a emissão da Nota Fiscal Eletrônica de Serviços de Itapipoca/CE para o anunciante em até 5 dias úteis.
              </p>
            </div>
          `.trim();

          // Envia o e-mail de alerta para o suporte
          const supportResult = await sendEmail('suporte@proita.com.br', emailSubject, emailText, emailHtml);
          console.log('[NFS-e Email Support] Resultado do envio para suporte:', supportResult);

          // Envia uma confirmação para o anunciante no e-mail informado por ele
          const userSubject = `[proITA] Solicitação de Nota Fiscal Eletrônica (NFS-e) Recebida`;
          const userText = `
Olá ${userName},

Recebemos a sua solicitação de Nota Fiscal Eletrônica (NFS-e) referente à sua assinatura no portal proITA.

A Nota Fiscal de Serviços Eletrônica (NFS-e) será emitida pela prefeitura municipal de Itapipoca/CE e enviada para este endereço de e-mail (${email}) em até 5 dias úteis.

Dados da solicitação:
- Nome: ${userName}
- Código do Anúncio (Referência): ${referenceCode}
- E-mail para envio da Nota: ${email}

Atenciosamente,
Suporte proITA
          `.trim();

          const userHtml = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Solicitação de NFS-e Recebida</h2>
              <p>Olá <strong>${userName}</strong>,</p>
              <p>Confirmamos que recebemos a sua solicitação de Nota Fiscal de Serviços Eletrônica (NFS-e) para a sua assinatura no portal <strong>proITA</strong>.</p>
              <p>A NFS-e será emitida pela prefeitura municipal de Itapipoca/CE e enviada para o endereço de e-mail informado (<strong>${email}</strong>) no prazo de até <strong>5 dias úteis</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; font-size: 14px; color: #1e3a8a; text-transform: uppercase;">Dados do Pedido</h3>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Referência do Anúncio:</strong> ${referenceCode}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>E-mail de Destino:</strong> ${email}</p>
              </div>

              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 15px;">
                Esta é uma mensagem de confirmação automática. Em caso de dúvidas, entre em contato pelo e-mail <a href="mailto:suporte@proita.com.br" style="color: #2563eb;">suporte@proita.com.br</a>.
              </p>
            </div>
          `.trim();

          const userResult = await sendEmail(email, userSubject, userText, userHtml);
          console.log('[NFS-e Email User] Resultado do envio de confirmação para o usuário:', userResult);
        }
      } catch (errEmail) {
        console.error('[NFS-e Email Error] Não foi possível enviar e-mail de alerta:', errEmail);
      }

      return res.status(201).json({
        success: true,
        message: 'Solicitação de Nota Fiscal Eletrônica (NFS-e) enviada com sucesso! Ela será processada e enviada para o seu e-mail em até 5 dias úteis.',
        data: nfeRequest
      });

    } catch (err) {
      console.error('[POST /api/payments/nfe-request] Erro:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar a solicitação da Nota Fiscal.'
      });
    }
  });

  return router;
};
