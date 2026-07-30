export const MOCK_USER = {
  id: 1,
  firstName: "João",
  lastName: "Silva",
  phone: "(11) 98765-4321",
  isWhatsApp: true,
  neighborhood: "Centro",
  isProfessional: false, // Pode ser alterado para testar
};

export const MOCK_CATEGORIES = [
  { id: 1, name: "Encanador", icon: "Wrench" },
  { id: 2, name: "Eletricista", icon: "Zap" },
  { id: 3, name: "Pintor", icon: "PaintRoller" },
  { id: 4, name: "Marceneiro", icon: "Hammer" },
  { id: 5, name: "Limpeza", icon: "Sparkles" },
  { id: 6, name: "Montador", icon: "Screwdriver" },
];

export const MOCK_PROFESSIONALS = [
  {
    id: "mock-eletricista",
    name: "Carlos Eletricista",
    category: "Eletricista",
    categoriaGeral: "Reparos e Assistência Técnica",
    atividadePrincipal: "Eletricista",
    shortDescription: "Serviços de fiação, tomadas, lâmpadas e disjuntores em Itapipoca.",
    fullDescription: "Especialista em instalações e manutenções elétricas residenciais e comerciais. Atendimento rápido e seguro para reparos de tomadas, fiação e chuveiros.",
    location: "Centro",
    serviceBairro: "Centro",
    rating: 4.9,
    reviewCount: 24,
    tags: ["tomada", "lampada", "fiação", "energia", "instalar", "manutenção", "reparo", "chuveiro"]
  },
  {
    id: "mock-psicologo",
    name: "Dra. Juliana Psicóloga",
    category: "Psicólogo",
    categoriaGeral: "Saúde e Bem-estar",
    atividadePrincipal: "Psicólogo",
    shortDescription: "Acompanhamento psicológico para saúde mental, ansiedade e terapia.",
    fullDescription: "Psicoterapia individual para adolescentes e adultos. Tratamento focado em saúde mental, ansiedade, depressão e inteligência emocional.",
    location: "Boa Vista",
    serviceBairro: "Boa Vista",
    rating: 5.0,
    reviewCount: 31,
    tags: ["saude mental", "terapia", "ansiedade", "depressão", "comportamento", "psicologia", "emocional"]
  }
];



