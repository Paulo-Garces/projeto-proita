/**
 * Nome público do anúncio: prioriza nomeExibicao / sobrenomeExibicao no Profile;
 * fallback em user.nome / user.sobrenome (anúncios antigos ou GET /me sem include user).
 *
 * @param {object} profile — objeto Profile (ou anúncio) com campos opcionais e opcionalmente `user`
 * @param {object} [fallbackUser] — User do contexto (ex.: sessão) quando `profile.user` não vier na API
 */
export function getProfileDisplayName(profile, fallbackUser) {
  if (!profile) return '';
  const u = profile.user ?? fallbackUser;

  const hasNomeExibicao = profile.nomeExibicao != null && String(profile.nomeExibicao).trim() !== '';
  const hasSobrenomeExibicao = profile.sobrenomeExibicao != null && String(profile.sobrenomeExibicao).trim() !== '';

  if (hasNomeExibicao || hasSobrenomeExibicao) {
    const nome = hasNomeExibicao ? String(profile.nomeExibicao).trim() : '';
    const sob = hasSobrenomeExibicao ? String(profile.sobrenomeExibicao).trim() : '';
    return [nome, sob].filter(Boolean).join(' ').trim();
  }

  const nome = u?.nome != null ? String(u.nome).trim() : '';
  const sob = u?.sobrenome != null ? String(u.sobrenome).trim() : '';
  return [nome, sob].filter(Boolean).join(' ').trim();
}

/** Texto para parâmetro `name` do ui-avatars.com */
export function getProfileAvatarNameParam(profile, fallbackUser) {
  const full = getProfileDisplayName(profile, fallbackUser);
  return full || 'Profissional';
}
