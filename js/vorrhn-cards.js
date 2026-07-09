/* ============================================================
   LUNARIUM'S LAB — vorrhn-cards.js
   Dados do baralho. "power" é o poder base impresso na carta.
   effect é resolvido em vorrhn-engine.js.
   ============================================================ */

window.VORRHN_CARDS = [
  // ---- Criaturas (16) — sem efeito, só poder ----
  { id: "c1", type: "criatura", name: "Cervo Esfolado", power: 2 },
  { id: "c2", type: "criatura", name: "Corvo Bicéfalo", power: 3 },
  { id: "c3", type: "criatura", name: "Lobo Sem Face", power: 3 },
  { id: "c4", type: "criatura", name: "Rã Vítrea", power: 1 },
  { id: "c5", type: "criatura", name: "Urso Cindicado", power: 4 },
  { id: "c6", type: "criatura", name: "Serpente de Cera", power: 2 },
  { id: "c7", type: "criatura", name: "Coruja Invertida", power: 3 },
  { id: "c8", type: "criatura", name: "Cabra Trigêmea", power: 2 },
  { id: "c9", type: "criatura", name: "Peixe-Lua Oco", power: 1 },
  { id: "c10", type: "criatura", name: "Javali de Ferro", power: 4 },
  { id: "c11", type: "criatura", name: "Aranha Sussurrante", power: 2 },
  { id: "c12", type: "criatura", name: "Morcego Sem Sombra", power: 2 },
  { id: "c13", type: "criatura", name: "Cão de Sal", power: 3 },
  { id: "c14", type: "criatura", name: "Gato de Cinzas", power: 1 },
  { id: "c15", type: "criatura", name: "Touro Costurado", power: 4 },
  { id: "c16", type: "criatura", name: "Andorinha Podre", power: 2 },

  // ---- Anjos (5) — abençoam vizinhos ortogonais (+2 poder, uma vez) ----
  { id: "a1", type: "anjo", name: "Serafim Cego", power: 1, effect: "bless" },
  { id: "a2", type: "anjo", name: "Arauto de Ossos", power: 1, effect: "bless" },
  { id: "a3", type: "anjo", name: "Vigília Alada", power: 2, effect: "bless" },
  { id: "a4", type: "anjo", name: "Coro Mudo", power: 1, effect: "bless" },
  { id: "a5", type: "anjo", name: "Anjo da Última Luz", power: 2, effect: "bless" },

  // ---- Demônios (5) — amaldiçoam vizinhos ortogonais (-1 poder, uma vez) ----
  { id: "d1", type: "demonio", name: "Devorador de Nomes", power: 5, effect: "curse" },
  { id: "d2", type: "demonio", name: "Príncipe Cinza", power: 4, effect: "curse" },
  { id: "d3", type: "demonio", name: "Sussurro do Abismo", power: 4, effect: "curse" },
  { id: "d4", type: "demonio", name: "Fome Sem Fundo", power: 5, effect: "curse" },
  { id: "d5", type: "demonio", name: "Guardião Invertido", power: 4, effect: "curse" },

  // ---- Parasitas (4) — só podem ser soltos sobre uma carta já colocada ----
  { id: "p1", type: "parasita", name: "Lapa Rastejante", power: 0, effect: "fuse" },
  { id: "p2", type: "parasita", name: "Verme do Nome", power: 0, effect: "fuse" },
  { id: "p3", type: "parasita", name: "Broto Fúngico", power: 0, effect: "fuse" },
  { id: "p4", type: "parasita", name: "Filamento Ávido", power: 0, effect: "fuse" },

  // ---- Entidades Cósmicas (3) — efeitos únicos e devastadores ----
  { id: "e1", type: "entidade", name: "Buraco Devorador", power: 3, effect: "devour",
    desc: "Consome as 8 cartas vizinhas e absorve o poder delas." },
  { id: "e2", type: "entidade", name: "Nebulosa Ecoante", power: 3, effect: "echo",
    desc: "Dobra o poder de toda carta na mesma linha e coluna." },
  { id: "e3", type: "entidade", name: "Olho Onisciente", power: 3, effect: "reveal",
    desc: "Compra 3 cartas extras imediatamente." }
];

window.VORRHN_TYPE_INFO = {
  criatura: { label: "Criatura", tint: "#8a8a94" },
  anjo:     { label: "Anjo",     tint: "#e9d9a0" },
  demonio:  { label: "Demônio",  tint: "#9a2f2f" },
  parasita: { label: "Parasita", tint: "#5c8a5c" },
  entidade: { label: "Entidade Cósmica", tint: "#7d5ce0" }
};
