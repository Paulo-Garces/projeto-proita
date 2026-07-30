/**
 * Normaliza uma string removendo acentos e convertendo para letras minúsculas.
 * Exemplo: 'Saúde & Bem-Estar' -> 'saude & bem-estar'
 */
export const normalize = (str) =>
  str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
