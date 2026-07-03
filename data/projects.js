/* ============================================================
   LUNARIUM'S LAB — data/projects.js
   Edite este arquivo à mão pra manter o laboratório atualizado.
   Nenhum build step: é só um objeto JS carregado antes das
   páginas que precisam dele (home, news, repo).
   ============================================================ */

/* Repositórios do GitHub que alimentam a aba "Notícias".
   Troque "owner" pelo seu usuário/organização real no GitHub. */
window.LUNARIUM_GITHUB_REPOS = [
  { owner: "lunarium-dev", repo: "the-lamp-lighter.github.io" },
  { owner: "lunarium-dev", repo: "kon-desktop" },
  { owner: "lunarium-dev", repo: "a-r-k-a" }
];

/* Projetos/scripts/apps — cada um com histórico de versões,
   como um mini "Diversion" embutido no site.
   `diversionId` é só um espaço reservado: quando o projeto
   estiver de fato versionado no Diversion, coloque o ID/URL
   real aqui pra sincronizar automaticamente no futuro. */
window.LUNARIUM_PROJECTS = [
  {
    id: "anthology-ue5",
    name: "Anthology — UE5",
    category: "Unreal Engine",
    icon: "fa-cubes",
    description: "Antologia com histórias de gêneros diferentes num único executável, convergindo num final em comum.",
    diversionId: null,
    versions: [
      { version: "v0.4.0", date: "2026-06-28", changelog: "Terminal estilizado (Arch/Garuda) com DataTable de comandos.", downloadUrl: "#" },
      { version: "v0.3.0", date: "2026-06-10", changelog: "Sistema de partículas Niagara reativo à música via submix.", downloadUrl: "#" },
      { version: "v0.2.0", date: "2026-05-22", changelog: "Player de cinemática em loop com HUD de auto-hide.", downloadUrl: "#" },
      { version: "v0.1.0", date: "2026-05-02", changelog: "Arquitetura de pastas e sistema de botão reutilizável.", downloadUrl: "#" }
    ]
  },
  {
    id: "kon-desktop",
    name: "kon-desktop",
    category: "Electron",
    icon: "fa-desktop",
    description: "Companion desktop do K-ON! com máquina de estados por personagem e diálogos com efeito de digitação.",
    diversionId: null,
    versions: [
      { version: "v1.2.0", date: "2026-03-14", changelog: "Agendador de eventos ponderado + animações via spritesheet.", downloadUrl: "#" },
      { version: "v1.0.0", date: "2026-02-01", changelog: "Primeira versão pública com as cinco integrantes da HTT.", downloadUrl: "#" }
    ]
  },
  {
    id: "arka",
    name: "A.R.K.A",
    category: "Web · Nova aba",
    icon: "fa-window-restore",
    description: "Nova aba modular com cinco temas visuais, janelas flutuantes, visualizador 3D e terminal.",
    diversionId: null,
    versions: [
      { version: "v2.1.0", date: "2026-01-18", changelog: "Visualizador 3D com Three.js e widget de missões.", downloadUrl: "#" },
      { version: "v2.0.0", date: "2025-12-02", changelog: "Reescrita com janelas flutuantes arrastáveis e notas locais.", downloadUrl: "#" }
    ]
  },
  {
    id: "card-game",
    name: "VORRHN — jogo de cartas",
    category: "Design de jogos",
    icon: "fa-layer-group",
    description: "Cinco tipos de carta e um grimório de tradução de símbolos, parte do universo do jogo de terror/ARG.",
    diversionId: null,
    versions: [
      { version: "v0.2.0", date: "2026-04-09", changelog: "Seis finais mapeados, um deles sem gatilho documentado (proposital).", downloadUrl: "#" },
      { version: "v0.1.0", date: "2026-03-01", changelog: "Primeira lista de tipos de carta e sessão estimada de 15–30 min.", downloadUrl: "#" }
    ]
  }
];
