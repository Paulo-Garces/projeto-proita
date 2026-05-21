const convertToInternationalPhone = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  if (!clean) return null;
  // Se já começa com 55 e tem tamanho adequado (12 ou 13 dígitos, ex: 5588997235656 ou 558899723565)
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    return `+${clean}`;
  }
  return `+55${clean}`;
};

const getPhoneVariations = (phone) => {
  if (!phone) return [];
  const clean = phone.replace(/\D/g, '');
  if (!clean) return [phone];

  const variations = new Set();
  // 1. Formato original enviado (pode conter parênteses, traços, etc)
  variations.add(phone);
  // 2. Somente números (limpo)
  variations.add(clean);
  
  // 3. Padrão internacional (+55...)
  const intl = convertToInternationalPhone(phone);
  if (intl) {
    variations.add(intl);
    // 4. Padrão internacional sem o sinal de + (55...)
    variations.add(intl.replace(/^\+/, ''));
  }
  
  // 5. Formato nacional limpo (se começa com 55, removemos o 55)
  if (clean.startsWith('55') && clean.length > 2) {
    variations.add(clean.slice(2));
  } else {
    // Se não começa com 55, gera variação com 55 no início
    variations.add('55' + clean);
  }

  return Array.from(variations).filter(Boolean);
};

module.exports = {
  convertToInternationalPhone,
  getPhoneVariations
};
