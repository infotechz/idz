/* Estrutura oficial do curso Informática do Zero. courseVersion 2. */
const COURSE_VERSION = 2;

const lesson = (moduleId, id, title, description, minutes, practicalExample, exerciseTitles) => ({
  id, moduleId, title, description,
  introduction: `Nesta aula, você vai aprender ${title.toLowerCase()} com exemplos simples e seguros.`,
  objectives: [`Entender ${title.toLowerCase()}`, "Praticar com autonomia", "Reconhecer erros comuns"],
  learningOutcomes: [`Explicar ${title.toLowerCase()}`, "Executar a atividade proposta", "Aplicar no dia a dia"],
  contentSummary: description,
  practicalExample,
  commonMistakes: ["Pular etapas", "Não conferir o resultado", "Salvar no local errado"],
  finalSummary: `Ao concluir, você poderá aplicar ${title.toLowerCase()} com mais segurança.`,
  video: "",
  pdfUrl: "",
  imgUrl: "",
  estimatedMinutes: minutes,
  exercises: exerciseTitles.map((exerciseTitle, index) => ({
    id: `${id}-ex${index + 1}`,
    title: exerciseTitle,
    question: `Como você aplicaria o que aprendeu em ${title.toLowerCase()}?`,
    options: ["Praticando e conferindo cada etapa", "Ignorando o resultado", "Compartilhando senhas", "Pulando a atividade"],
    correctAnswer: 0,
    explanation: "A prática guiada e a conferência ajudam a consolidar o aprendizado.",
    difficulty: index ? "medio" : "facil",
    mandatory: true,
    estimatedMinutes: 5
  }))
});

const moduleDefinitions = [
  ["m1", "Módulo 1 — Conhecendo o computador", ["O que é um computador", "Componentes essenciais", "Dispositivos e conexões", "Ligar e desligar corretamente"]],
  ["m2", "Módulo 2 — Teclado e mouse", ["Principais teclas", "Cliques e seleção", "Atalhos essenciais", "Exercício de edição e salvamento"]],
  ["m3", "Módulo 3 — Arquivos e pastas", ["Arquivos e pastas", "Criar e organizar", "Copiar, mover e renomear", "Lixeira, downloads e restauração"]],
  ["m4", "Módulo 4 — Internet", ["Internet e navegador", "Pesquisas e abas", "Favoritos, links e downloads", "Sites suspeitos"]],
  ["m5", "Módulo 5 — E-mail", ["Criar e acessar conta", "Enviar e responder", "Anexos e organização", "Spam e golpes"]],
  ["m6", "Módulo 6 — Word", ["Criar e editar documentos", "Formatação e listas", "Imagens e organização", "Salvar e exportar PDF", "Projeto: currículo simples"]],
  ["m7", "Módulo 7 — Excel", ["Linhas, colunas e células", "Dados e formatação", "Fórmulas básicas", "Tabelas e porcentagens", "Projeto: planilha de gastos"]],
  ["m8", "Módulo 8 — PowerPoint", ["Criar apresentação", "Slides e layouts", "Texto e imagens", "Projeto: apresentação com 5 slides"]],
  ["m9", "Módulo 9 — Google Drive", ["Nuvem e armazenamento", "Upload e download", "Pastas e compartilhamento", "Permissões e acesso em outros dispositivos"]],
  ["m10", "Módulo 10 — Segurança digital", ["Senhas e 2FA", "Phishing e links suspeitos", "Golpes e dados pessoais", "Computadores públicos e logout", "Atualizações e backup"]],
  ["m11", "Módulo 11 — Inteligência artificial", ["O que é IA", "IA para estudo e trabalho", "Como escrever bons pedidos", "Revisar, conferir e proteger dados"]],
  ["m12", "Módulo 12 — Projeto final", ["Checklist do projeto final"]]
];

const examples = [
  "Organizar uma tarefa cotidiana no computador.",
  "Repetir a atividade com um arquivo de exemplo.",
  "Conferir o resultado antes de salvar.",
  "Resolver um pequeno desafio guiado."
];

const courseV2 = {
  courseVersion: COURSE_VERSION,
  title: "INFORMÁTICA DO ZERO",
  welcome: { id: "welcome", type: "welcome", title: "Boas-vindas", description: "Conheça a plataforma e comece sua jornada." },
  modules: moduleDefinitions.map(([moduleId, title, titles]) => ({
    id: moduleId, moduleId, type: moduleId === "m12" ? "project" : "lesson", title,
    lessons: titles.map((lessonTitle, index) => lesson(
      moduleId, `${moduleId}-a${index + 1}`, lessonTitle,
      `Conteúdo prático sobre ${lessonTitle.toLowerCase()}, com orientação passo a passo.`,
      moduleId === "m12" ? 30 : 15,
      examples[index % examples.length],
      index === titles.length - 1 ? ["Concluir a atividade", "Conferir o resultado"] : ["Praticar o conceito", "Identificar a aplicação"]
    ))
  })),
  finalProject: {
    id: "final-project", type: "project", title: "Projeto Final",
    steps: [
      "Estrutura de pastas", "Currículo", "Planilha financeira", "Apresentação",
      "E-mail com anexo", "Arquivos no Drive", "Exercício de segurança"
    ].map((title, index) => ({ id: `final-${index + 1}`, title, mandatory: true, completed: false }))
  },
  bonuses: [
    { id: "bonus-1", type: "bonus", title: "🎁 Bônus 1 — 30 atalhos de teclado", downloadUrl: "" },
    { id: "bonus-2", type: "bonus", title: "🎁 Bônus 2 — Modelo de currículo editável", downloadUrl: "", fallback: "Material em preparação" },
    { id: "bonus-3", type: "bonus", title: "🎁 Bônus 3 — Planilha financeira", downloadUrl: "", fallback: "Material em preparação" }
  ]
};

if (typeof window !== "undefined") window.IDZ_COURSE_V2 = courseV2;
