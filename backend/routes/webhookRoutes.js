'use strict';

/**
 * webhookRoutes.js
 * ────────────────────────────────────────────────────────────────────────────
 * Rota de Webhooks do Banco Inter para conciliação automática de status de plano.
 *
 * Endpoints:
 *  POST /api/webhooks/inter → Recebe notificações de PIX e Boleto pagos.
 * ────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();

module.exports = (prisma) => {

  // ── Middleware: Validação de Segurança mTLS do Banco Inter ─────────────────
  function webhookMtlsMiddleware(req, res, next) {
    const isBypass = process.env.INTER_BYPASS_WEBHOOK_MTLS === 'true' || process.env.INTER_MOCK_MODE === 'true';
    
    if (isBypass) {
      console.log('[Webhook mTLS] 🧪 Bypass ativo. Processando requisição...');
      return next();
    }

    // 1. Validação via Proxy Reverso (Nginx, Cloudflare, Render, etc.)
    // Proxies repassam cabeçalhos HTTP que indicam se o mTLS do cliente foi validado
    const sslClientVerify = req.headers['x-ssl-client-verify'] || 
                            req.headers['x-forwarded-client-verify'] || 
                            req.headers['ssl-client-verify'];

    if (sslClientVerify) {
      const verifyUpper = sslClientVerify.toUpperCase();
      if (verifyUpper === 'SUCCESS' || verifyUpper === 'VERIFIED') {
        console.log('[Webhook mTLS] 🛡️ Validado via cabeçalho do Proxy Reverso:', sslClientVerify);
        return next();
      }
    }

    // 2. Validação via Handshake TLS Direto no Node.js
    const cert = req.socket.getPeerCertificate();
    
    if (!cert || Object.keys(cert).length === 0) {
      console.warn('[Webhook mTLS] ❌ Acesso rejeitado: Certificado cliente ausente.');
      return res.status(401).json({ success: false, error: 'Acesso negado. Certificado mTLS ausente.' });
    }

    // Se o handshake SSL da aplicação autorizou
    if (req.client && req.client.authorized) {
      console.log('[Webhook mTLS] 🛡️ Autorizado via handshake TLS direto do servidor.');
      return next();
    }

    // Validação de segurança de fallback de emissores de certificado do Inter
    const issuer = cert.issuer?.CN || '';
    const subject = cert.subject?.CN || '';
    
    if (issuer.includes('Banco Inter') || subject.includes('Banco Inter') || issuer.includes('Inter') || subject.includes('Inter')) {
      console.log('[Webhook mTLS] 🛡️ Autorizado via metadados do certificado (Inter).');
      return next();
    }

    console.warn('[Webhook mTLS] ❌ Acesso negado: Certificado mTLS não autorizado.', req.client?.authorizationError);
    return res.status(403).json({ success: false, error: 'Certificado mTLS não autorizado.' });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // POST /api/webhooks/inter
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/inter', webhookMtlsMiddleware, async (req, res) => {
    try {
      const payload = req.body;
      console.log('[Webhook Inter] Notificação recebida:', JSON.stringify(payload));

      let conciliado = false;
      let logsConciliacao = [];

      // ── CASO A: Webhook de PIX (Lista de pix recebidos) ──────────────────────
      if (payload && Array.isArray(payload.pix)) {
        console.log(`[Webhook PIX] Processando ${payload.pix.length} transações de PIX...`);

        for (const item of payload.pix) {
          const { txid, valor } = item;

          if (!txid) continue;

          // Busca o usuário que possui este PIX pendente
          const user = await prisma.user.findUnique({
            where: { pendingTxid: txid }
          });

          if (user) {
            console.log(`[Webhook PIX] Usuário encontrado: ${user.nome} (id: ${user.id}) para txid: ${txid}`);
            
            // Determina as propriedades do plano com base no pendingPlanId
            let planStatus = 'ATIVO'; // Default: Patrocinador
            let durationDays = 365;

            let planType = 'PRO_ANUAL';
            if (user.pendingPlanId) {
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
            if (user.planStatus === 'ATIVO' && user.subscriptionEndsAt && user.subscriptionEndsAt > baseDate) {
              baseDate = new Date(user.subscriptionEndsAt);
            }
            const subscriptionEndsAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // Atualiza status do usuário no banco de dados
            await prisma.user.update({
              where: { id: user.id },
              data: {
                planStatus,
                subscriptionEndsAt,
                planType,
                trialEndsAt: null, // Encerra degustação
                pendingTxid: null, // Limpa pendências
                pendingPlanId: null,
                pendingNossoNumero: null
              }
            });

            const msg = `PIX Conciliado: Plano ${planStatus} ativado para ${user.nome} até ${subscriptionEndsAt.toLocaleDateString('pt-BR')}`;
            console.log(`[Webhook PIX] 🎉 ${msg}`);
            logsConciliacao.push(msg);
            conciliado = true;
          } else {
            console.log(`[Webhook PIX] txid "${txid}" não associado a nenhum usuário do sistema.`);
          }
        }
      }

      // ── CASO B: Webhook de Boleto (Apenas uma cobrança por payload) ─────────
      if (payload && payload.nossoNumero) {
        const { nossoNumero, situacao, valorRecebido } = payload;
        console.log(`[Webhook Boleto] Nosso Número: ${nossoNumero}, Situação: ${situacao}`);

        // O status pago varia dependendo da versão, mas 'PAGO' ou 'COMPENSADO' indica liquidação
        const estaPago = situacao === 'PAGO' || situacao === 'COMPENSADO';

        if (estaPago) {
          // Busca o usuário que possui este boleto pendente
          const user = await prisma.user.findUnique({
            where: { pendingNossoNumero: nossoNumero }
          });

          if (user) {
            console.log(`[Webhook Boleto] Usuário encontrado: ${user.nome} (id: ${user.id}) para Boleto nossoNumero: ${nossoNumero}`);
            
            let planStatus = 'ATIVO';
            let durationDays = 365;

            let planType = 'PRO_ANUAL';
            if (user.pendingPlanId) {
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
            if (user.planStatus === 'ATIVO' && user.subscriptionEndsAt && user.subscriptionEndsAt > baseDate) {
              baseDate = new Date(user.subscriptionEndsAt);
            }
            const subscriptionEndsAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // Atualiza status do usuário no banco de dados
            await prisma.user.update({
              where: { id: user.id },
              data: {
                planStatus,
                subscriptionEndsAt,
                planType,
                trialEndsAt: null,
                pendingNossoNumero: null, // Limpa pendências
                pendingPlanId: null,
                pendingTxid: null
              }
            });

            const msg = `Boleto Conciliado: Plano ${planStatus} ativado para ${user.nome} até ${subscriptionEndsAt.toLocaleDateString('pt-BR')}`;
            console.log(`[Webhook Boleto] 🎉 ${msg}`);
            logsConciliacao.push(msg);
            conciliado = true;
          } else {
            console.log(`[Webhook Boleto] Boleto nossoNumero "${nossoNumero}" não associado a nenhum usuário do sistema.`);
          }
        } else {
          console.log(`[Webhook Boleto] Situação do boleto é "${situacao}". Nenhuma ativação realizada.`);
        }
      }

      // Retorna resposta de sucesso para o banco
      return res.status(200).json({
        success: true,
        message: 'Notificação recebida com sucesso.',
        conciliado,
        logs: logsConciliacao
      });

    } catch (err) {
      console.error('[POST /api/webhooks/inter] Erro no processamento:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar o webhook.'
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // POST /api/webhooks/infinitepay  (webhook público para a InfinitePay)
  // ──────────────────────────────────────────────────────────────────────────────
  router.post('/infinitepay', async (req, res) => {
    try {
      const payload = req.body;
      console.log('[Webhook InfinitePay] Notificação recebida:', JSON.stringify(payload));

      const txid = payload.order_nsu || payload.metadata?.order_nsu || payload.id;

      if (!txid) {
        console.warn('[Webhook InfinitePay] ❌ Nenhum identificador/order_nsu encontrado no payload.');
        return res.status(400).json({ success: false, error: 'Identificador do pedido (order_nsu) não encontrado.' });
      }

      // Busca o usuário que possui esta transação pendente
      const user = await prisma.user.findUnique({
        where: { pendingTxid: txid }
      });

      if (!user) {
        console.log(`[Webhook InfinitePay] txid/order_nsu "${txid}" não associado a nenhum usuário pendente.`);
        return res.status(200).json({ success: true, message: 'Pedido processado ou ignorado.' });
      }

      console.log(`[Webhook InfinitePay] Usuário encontrado: ${user.nome} (id: ${user.id}) para order_nsu: ${txid}`);

      // Determina as propriedades do plano com base no pendingPlanId
      let planStatus = 'ATIVO'; // Default: Patrocinador
      let durationDays = 365;
      let planType = 'PRO_ANUAL';

      if (user.pendingPlanId) {
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
      if (user.planStatus === 'ATIVO' && user.subscriptionEndsAt && user.subscriptionEndsAt > baseDate) {
        baseDate = new Date(user.subscriptionEndsAt);
      }
      const subscriptionEndsAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Atualiza status do usuário no banco de dados
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planStatus,
          subscriptionEndsAt,
          planType,
          trialEndsAt: null, // Encerra degustação
          pendingTxid: null, // Limpa pendências
          pendingPlanId: null,
          pendingNossoNumero: null
        }
      });

      console.log(`[Webhook InfinitePay] 🎉 Plano ${planStatus} ativado para ${user.nome} até ${subscriptionEndsAt.toLocaleDateString('pt-BR')}`);
      return res.status(200).json({ success: true, message: 'Plano ativado com sucesso.' });

    } catch (err) {
      console.error('[POST /api/webhooks/infinitepay] Erro no processamento:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar o webhook da InfinitePay.'
      });
    }
  });

  return router;
};
