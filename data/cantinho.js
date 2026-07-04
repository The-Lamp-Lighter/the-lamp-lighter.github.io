/* ============================================================
   LUNARIUM'S LAB — data/cantinho.js
   Espaço pessoal: "Meus Trabalhos" (sincronizado com o ArtStation)
   e links rápidos das suas redes sociais.
   ============================================================ */

/* Seu usuário no ArtStation (só o nome, sem URL completa).
   É o que aparece depois de artstation.com/ no seu perfil.
   A sincronização automática TENTA usar isso, mas depende de um
   endpoint que o ArtStation não abriu oficialmente pra fora — pode
   falhar sem aviso, isso não é algo que dá pra garantir 100%. */
window.LUNARIUM_ARTSTATION_USERNAME = "lunarium_nebula";

/* Forma 100% garantida de mostrar um trabalho, sem depender de nada
   externo: preencha à mão, igual os outros dados do site. Isso
   aparece JUNTO com o que a sincronização automática trouxer (se ela
   funcionar). Use pra trabalhos que você quer garantir que apareçam,
   ou se a sincronização automática não estiver funcionando por algum
   motivo.
   `tools` e `description` são opcionais — pode deixar `[]` e "". */
window.LUNARIUM_ARTWORKS = [
  // {
  //   title: "Nome do trabalho",
  //   url: "https://www.artstation.com/artwork/xxxxx",
  //   cover: "https://link-direto-da-imagem.jpg",
  //   date: "2026-07-01",
  //   tools: ["Blender", "Photoshop"],
  //   description: "Uma frase curta sobre o trabalho."
  // },
];

/* Referências extras que não vêm do ArtStation — cole aqui os links
   de imagens que você já tem salvas em algum lugar (Pinterest, etc).
   Eu não posso buscar ou embutir arte de anime/mangá por conta de
   direitos autorais, mas qualquer link que já é seu funciona liso.
   Deixe vazio ([]) que essa seção simplesmente não aparece. */
window.LUNARIUM_MOODBOARD = [
  // { url: "https://...", caption: "legenda curta (opcional)" },
];

/* Links rápidos — troque ou adicione à vontade. */
window.LUNARIUM_CANTINHO_LINKS = [
  { label: "Pinterest", url: "https://br.pinterest.com/LunariumNova/", icon: "fa-brands fa-pinterest" },
  { label: "Instagram", url: "https://www.instagram.com/lunariummoon/", icon: "fa-brands fa-instagram" },
  { label: "Artstation", url: "https://www.artstation.com/lunarium_nebula", icon: "fa-brands fa-artstation" },
  { label: "X (Twitter)", url: "https://twitter.com/LunariumNebula", icon: "fa-brands fa-x-twitter" }
];
