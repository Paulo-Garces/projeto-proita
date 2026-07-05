/**
 * Calcula o selo de reputação (Selo) para um profissional com base nas regras estabelecidas.
 *
 * Regras de Elegibilidade (Todas obrigatórias):
 * 1. Conta criada há pelo menos 30 dias (createdAt).
 * 2. Mínimo de 5 avaliações (reviewCount >= 5).
 * 3. Perfil completo (deve possuir foto de perfil e horariosFuncionamento preenchidos).
 *
 * Categorias do Selo (com base na nota - rating):
 * - Menos de 3.0: Sem selo (null)
 * - 3.0 a 3.4: Bronze (text-amber-700, ícone Award)
 * - 3.5 a 4.4: Prata (text-slate-400, ícone Award)
 * - 4.5 a 5.0: Ouro (text-yellow-500, ícone ShieldCheck ou Award)
 *
 * @param {object} p - Objeto do profissional/anúncio
 * @returns {object|null} Dados do selo ou null se não elegível
 */
export function getReputationBadge(p) {
  if (!p) return null;

  // 0. Elegibilidade de Assinatura
  const planStatus = p.user?.planStatus || p.planStatus || 'DEGUSTACAO';
  const isEligible = ['ATIVO', 'PATROCINADOR', 'TESTE', 'DEGUSTACAO'].includes(planStatus);
  if (!isEligible) return null;

  // 1. Conta criada há pelo menos 30 dias
  const createdAt = p.createdAt || p.profileCreatedAt;
  if (!createdAt) return null;
  const createdDate = new Date(createdAt);
  const diffTime = Math.abs(new Date() - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return null;

  // 2. Mínimo de 5 avaliações
  const reviewCount = p.reviewCount ?? p.reviewsCount ?? 0;
  if (reviewCount < 5) return null;

  // 3. Regras de Completude do Perfil (Estritas)
  const hasGoogle = !!(p.user?.googleId || p.googleId);
  const hasPhone = p.telefoneComercial || p.whatsapp || p.phone || p.user?.telefone;
  const hasBio = p.sobre || p.descricao || p.bio;
  if (!hasGoogle || !hasPhone || !hasBio) return null;

  // 4. Classificação com base na nota
  const rating = p.rating ?? 0;
  if (rating < 3.0) return null;

  if (rating >= 3.0 && rating < 3.5) {
    return {
      level: 'bronze',
      name: 'Bronze',
      color: 'text-amber-700 fill-amber-700/10',
      title: 'Profissional Bronze',
      icon: 'Award'
    };
  } else if (rating >= 3.5 && rating < 4.5) {
    return {
      level: 'prata',
      name: 'Prata',
      color: 'text-slate-400 fill-slate-400/10',
      title: 'Profissional Prata',
      icon: 'Award'
    };
  } else if (rating >= 4.5 && rating <= 5.0) {
    return {
      level: 'ouro',
      name: 'Ouro',
      color: 'text-yellow-500 fill-yellow-500/10',
      title: 'Profissional Ouro',
      icon: 'ShieldCheck'
    };
  }

  return null;
}
