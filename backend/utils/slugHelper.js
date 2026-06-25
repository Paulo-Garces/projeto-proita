function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function generateSlug(name, prisma) {
  if (!name) name = 'profissional';
  let baseSlug = removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) baseSlug = 'profissional';

  let uniqueSlug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await prisma.profile.findUnique({
      where: { slug: uniqueSlug }
    });
    if (!existing) {
      break;
    }
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

module.exports = {
  removeAccents,
  generateSlug
};
