/* ============================================================
   LUNARIUM'S LAB — supabase-client.js
   Cria o cliente único (window.sb) usado em todas as páginas.
   Precisa ser carregado DEPOIS do SDK oficial do Supabase e do
   supabase-config.js.
   ============================================================ */
(function () {
  "use strict";
  if (!window.supabase || !window.LUNARIUM_SUPABASE_URL || !window.LUNARIUM_SUPABASE_KEY) {
    console.error("Supabase não inicializou — confira supabase-config.js e se o SDK carregou.");
    return;
  }
  window.sb = window.supabase.createClient(window.LUNARIUM_SUPABASE_URL, window.LUNARIUM_SUPABASE_KEY);
})();
