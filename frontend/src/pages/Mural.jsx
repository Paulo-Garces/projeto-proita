import { useState } from 'react';
import { Calendar, Building2, ExternalLink, GraduationCap, Briefcase, FileText } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '📰' },
  { id: 'capacitacao', label: 'Capacitação', emoji: '🎓' },
  { id: 'empregos', label: 'Empregos', emoji: '💼' },
  { id: 'editais', label: 'Editais', emoji: '🏛️' }
];

const MOCK_OPORTUNIDADES = [
  {
    id: 1,
    category: 'capacitacao',
    categoryLabel: 'Capacitação',
    title: 'Curso Empreendedorismo de Sucesso - SEBRAE Itapipoca',
    description: 'Aprenda a estruturar seu modelo de negócio, fluxo de caixa e estratégias de marketing digital para alavancar suas vendas regionais.',
    date: '25 Jun, 2026',
    source: 'SEBRAE Itapipoca',
    url: 'https://sebrae.com.br'
  },
  {
    id: 2,
    category: 'editais',
    categoryLabel: 'Editais',
    title: 'Edital de Fomento à Cultura e Economia Criativa - Prefeitura',
    description: 'Abertura de inscrições para projetos artísticos, artesanais e de manifestação cultural no município de Itapipoca com incentivo financeiro para artistas locais.',
    date: '20 Jun, 2026',
    source: 'Prefeitura de Itapipoca',
    url: 'https://itapipoca.ce.gov.br'
  },
  {
    id: 3,
    category: 'capacitacao',
    categoryLabel: 'Capacitação',
    title: 'Curso Superior de Tecnologia em Alimentos - Processo Seletivo IFCE',
    description: 'Vagas abertas para cursos técnicos e superiores gratuitos no campus do IFCE Itapipoca. Inscrições online até o fim do mês.',
    date: '18 Jun, 2026',
    source: 'IFCE Campus Itapipoca',
    url: 'https://ifce.edu.br/itapipoca'
  },
  {
    id: 4,
    category: 'empregos',
    categoryLabel: 'Empregos',
    title: 'Vagas de Emprego Ativas no SINE Itapipoca',
    description: 'Oportunidades abertas para Vendedor Lojista, Auxiliar de Cozinha, Eletricista Industrial e Recepcionista. Compareça com currículo atualizado.',
    date: '19 Jun, 2026',
    source: 'SINE Itapipoca / IDT',
    url: 'https://www.idt.org.br'
  },
  {
    id: 5,
    category: 'editais',
    categoryLabel: 'Editais',
    title: 'Edital para Credenciamento de Microempreendedores Individuais (MEI)',
    description: 'Credenciamento de MEIs locais para prestação de serviços de manutenção, limpeza e pequenos reparos junto aos prédios públicos da Prefeitura.',
    date: '15 Jun, 2026',
    source: 'Secretaria de Desenvolvimento Econômico',
    url: 'https://itapipoca.ce.gov.br'
  }
];

export default function Mural() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredOportunidades = activeCategory === 'all'
    ? MOCK_OPORTUNIDADES
    : MOCK_OPORTUNIDADES.filter(item => item.category === activeCategory);

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'capacitacao':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'empregos':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'editais':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'capacitacao':
        return <GraduationCap size={14} className="mr-1 inline-block align-text-bottom text-sky-500" />;
      case 'empregos':
        return <Briefcase size={14} className="mr-1 inline-block align-text-bottom text-emerald-500" />;
      case 'editais':
        return <FileText size={14} className="mr-1 inline-block align-text-bottom text-violet-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      <div className="text-center md:text-left mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
          Mural de Oportunidades
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Fique por dentro das últimas vagas, cursos gratuitos, editais públicos e capacitações em Itapipoca.
        </p>
      </div>

      {/* Filtros em Pílulas com Scroll Horizontal Suave */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-none snap-x select-none">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-150 shrink-0 snap-start flex items-center gap-1.5 cursor-pointer shadow-sm ${
              activeCategory === category.id
                ? 'bg-primary text-white border-primary shadow-sky-100'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Oportunidades */}
      {filteredOportunidades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOportunidades.map(item => (
            <div
              key={item.id}
              className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Categoria e Data */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border flex items-center ${getCategoryStyles(item.category)}`}>
                    {getCategoryIcon(item.category)}
                    {item.categoryLabel}
                  </span>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <Calendar size={12} className="mr-1 shrink-0" />
                    {item.date}
                  </div>
                </div>

                {/* Título e Descrição */}
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug line-clamp-2 hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center text-xs text-slate-500 font-semibold max-w-[55%] truncate">
                  <Building2 size={13} className="mr-1.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={item.source}>{item.source}</span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group shrink-0"
                >
                  Acessar original
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium">Nenhuma oportunidade disponível nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
