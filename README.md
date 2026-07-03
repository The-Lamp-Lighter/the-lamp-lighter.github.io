# Lunarium's Lab

Centro de ações pessoal — terminal, notícias dos repositórios, versionamento
de scripts/apps ("mini Diversion") e chat, tudo num site estático (dá pra
hospedar no GitHub Pages, igual o site antigo).

## Como abrir

Não precisa de build nem servidor: abra `index.html` num navegador
(ou hospede a pasta inteira no GitHub Pages). Recomendo rodar por um
servidor local simples ao testar (o `fetch` do GitHub funciona melhor
assim do que abrindo o `.html` direto como arquivo):

```
python3 -m http.server 8000
```

e acessar `http://localhost:8000`.

## Estrutura

```
index.html      → tela de entrada (login local + preview de estilos)
home.html       → painel / centro de ações
terminal.html   → console com comandos (help, theme, color, repo, news…)
news.html       → atividade recente dos repositórios (GitHub API)
repo.html       → catálogo de projetos/scripts/apps com versões
chat.html       → perfil + contatos por código + conversas

css/base.css    → layout, componentes, painel de aparência
css/themes.css  → os 5 estilos (lunarium, retro, futurista, cyberpunk, fofo)

js/theme.js     → roda de cor + troca de estilo (localStorage)
js/auth.js      → sessão local simples
js/nav.js       → monta a barra lateral/topo em todas as páginas
js/terminal.js  → comandos do terminal
js/news.js      → busca commits via API pública do GitHub
js/repo.js      → renderiza os cartões de projeto/versão
js/chat.js      → perfil, contatos e conversas (protótipo local)

data/projects.js → EDITE AQUI: repositórios do GitHub + projetos/versões
```

## O que editar primeiro

Em `data/projects.js`:

- `LUNARIUM_GITHUB_REPOS`: troque `owner`/`repo` pelos seus repositórios
  reais no GitHub — isso alimenta a página de Notícias e o comando
  `news` do terminal.
- `LUNARIUM_PROJECTS`: seus scripts/apps/projetos, com histórico de
  versões. Cada versão tem `downloadUrl` — aponte pro link real do
  arquivo (ou deixe `#` por enquanto).

## Sobre o chat

Como o site é estático (sem servidor), o chat funciona por enquanto como
protótipo: perfil, código único e conversas ficam salvos no
`localStorage` do navegador. Tem um contato de demonstração ("Lua — bot
local") que responde na hora, só pra testar a interface. Pra chat de
verdade entre dispositivos diferentes, dá pra ligar `js/chat.js` a um
backend (ex: Supabase, mesmo esquema do protótipo de chat que você já
começou) — as funções já estão separadas pensando nisso.

## Sobre o Diversion

A aba Repositórios funciona como um Diversion pessoal, embutido no
site: histórico de versões e downloads sem precisar abrir o app. Cada
projeto tem um campo `diversionId` reservado — quando o projeto
estiver de fato versionado no Diversion, é só preencher esse campo
pra futura sincronização automática via API.

## Adicionando um comando novo no terminal

Em `js/terminal.js`, registre em `COMMANDS`:

```js
meucomando: {
  desc: "descrição curta",
  run: function (args) { line("resultado aqui"); }
}
```
