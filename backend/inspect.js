const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('C:\\Users\\pr-ga\\.gemini\\antigravity\\brain\\31122f74-8fe3-484d-994a-13a467bc9599\\.system_generated\\steps\\517\\content.md', 'utf8');
const $ = cheerio.load(html);

console.log('--- HEADLINES ---');
$('h1, h2, h3, h4, h5').slice(0, 50).each((i, el) => {
  const text = $(el).text().trim();
  const className = $(el).attr('class') || '';
  const id = $(el).attr('id') || '';
  if (text.length > 0) {
    console.log(`${el.name} (id="${id}", class="${className}"): ${text.substring(0, 80)}`);
  }
});

console.log('--- LINKS ---');
$('a').slice(0, 100).each((i, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (text.length > 0 && (href.includes('noticia') || href.includes('publicaca') || href.includes('diario') || href.includes('2026') || href.includes('2025'))) {
    console.log(`Link: ${text} -> ${href}`);
  }
});
