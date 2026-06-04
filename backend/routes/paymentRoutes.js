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
          pdfBase64:      null,
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

  return router;
};
