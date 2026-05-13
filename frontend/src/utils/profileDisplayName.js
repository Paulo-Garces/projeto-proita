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
  const nome =
    profile.nomeExibicao != null && String(profile.nomeExibicao).trim() !== ''
      ? String(profile.nomeExibicao).trim()
      : u?.nome != null
        ? String(u.nome).trim()
        : '';
  const sob =
    profile.sobrenomeExibicao != null && String(profile.sobrenomeExibicao).trim() !== ''
      ? String(profile.sobrenomeExibicao).trim()
      : u?.sobrenome != null
        ? String(u.sobrenome).trim()
        : '';
  return [nome, sob].filter(Boolean).join(' ').trim();
}

/** Texto para parâmetro `name` do ui-avatars.com */
export function getProfileAvatarNameParam(profile, fallbackUser) {
  const full = getProfileDisplayName(profile, fallbackUser);
  return full || 'Profissional';
}
