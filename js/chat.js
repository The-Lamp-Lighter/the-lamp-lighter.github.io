/* ============================================================
   LUNARIUM'S LAB — chat.js
   Protótipo de chat "estilo Discord": perfil com bio + código
   único, contatos adicionados por código, conversas por thread.

   IMPORTANTE (leia isso antes de esperar chat entre dispositivos
   diferentes): este é um site estático, sem servidor. Tudo aqui
   fica salvo no localStorage DESTE navegador. Um contato que você
   adiciona pelo código vira uma conversa local — pra troca de
   mensagens de verdade entre duas pessoas/dispositivos, esse
   módulo precisa ser ligado a um backend (o mesmo esquema de
   Supabase que já foi usado no protótipo de chat Next.js).
   Por isso ele já nasce separado em profile/contacts/threads:
   é o desenho pronto pra plugar um backend real depois, trocando
   só as funções desta seção por chamadas de API.
   ============================================================ */

(function () {
  "use strict";

  var K_PROFILE = "lunarium.chat.profile";
  var K_CONTACTS = "lunarium.chat.contacts";
  var K_THREADS = "lunarium.chat.threads";

  var AVATAR_EMOJIS = ["🌙","✨","🪐","🌌","👾","🦊","🐙","🌸","⚡","🔮","🖤","💫"];
  var DEMO_BOT = { code: "DEMO-0001", name: "Lua (bot local)", bio: "Bot de teste — responde na hora pra você experimentar o chat.", avatar: "🌙" };

  function genCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    function part(n) { var s = ""; for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]; return s; }
    return "LUNA-" + part(4) + "-" + part(2);
  }

  function getProfile() {
    try { return JSON.parse(localStorage.getItem(K_PROFILE)); } catch (e) { return null; }
  }
  function saveProfile(p) { localStorage.setItem(K_PROFILE, JSON.stringify(p)); }

  function getContacts() {
    try { return JSON.parse(localStorage.getItem(K_CONTACTS)) || []; } catch (e) { return []; }
  }
  function saveContacts(list) { localStorage.setItem(K_CONTACTS, JSON.stringify(list)); }

  function getThreads() {
    try { return JSON.parse(localStorage.getItem(K_THREADS)) || {}; } catch (e) { return {}; }
  }
  function saveThreads(t) { localStorage.setItem(K_THREADS, JSON.stringify(t)); }

  function createProfile(data) {
    var p = {
      name: data.name || "Sem nome",
      bio: data.bio || "",
      avatar: data.avatar || AVATAR_EMOJIS[0],
      code: genCode()
    };
    saveProfile(p);
    // semeia o bot de demonstração como primeiro contato
    var contacts = getContacts();
    if (!contacts.some(function (c) { return c.code === DEMO_BOT.code; })) {
      contacts.unshift(DEMO_BOT);
      saveContacts(contacts);
    }
    return p;
  }

  function addContactByCode(code) {
    code = (code || "").trim().toUpperCase();
    var profile = getProfile();
    if (!code) return { ok: false, error: "digite um código." };
    if (profile && code === profile.code) return { ok: false, error: "esse é o seu próprio código." };
    var contacts = getContacts();
    if (contacts.some(function (c) { return c.code === code; })) return { ok: false, error: "esse contato já está na sua lista." };

    if (code === DEMO_BOT.code) {
      contacts.push(DEMO_BOT);
      saveContacts(contacts);
      return { ok: true, contact: DEMO_BOT };
    }

    // sem backend real: cria um contato local "pendente". A conversa
    // fica visível pra você, mas só chega no aparelho da outra pessoa
    // quando este módulo estiver ligado a um servidor de verdade.
    var contact = { code: code, name: "Código " + code, bio: "Contato local — ainda sem sincronização real.", avatar: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)], pending: true };
    contacts.push(contact);
    saveContacts(contacts);
    return { ok: true, contact: contact };
  }

  function removeContact(code) {
    saveContacts(getContacts().filter(function (c) { return c.code !== code; }));
    var threads = getThreads();
    delete threads[code];
    saveThreads(threads);
  }

  function getThread(code) {
    return getThreads()[code] || [];
  }

  function botReply(text) {
    var t = text.toLowerCase();
    if (/\boi\b|ol[aá]|e ai|eae/.test(t)) return "oi! testando o chat do laboratório, né? 🌙";
    if (/tudo bem|como (vai|voc[eê])/.test(t)) return "por aqui tudo certo, sou só um bot local de teste!";
    if (/tema|cor|estilo/.test(t)) return "dica: dá pra trocar meu visual inteiro na roda de cor, no menu Aparência.";
    if (/tchau|falou|até/.test(t)) return "até mais! 👾";
    var fallback = ["interessante!", "hm, conta mais.", "anotado. 📝", "🌸", "esse chat ainda é um protótipo, mas já dá pra sentir o clima."];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  function sendMessage(code, text) {
    text = (text || "").trim();
    if (!text) return null;
    var threads = getThreads();
    if (!threads[code]) threads[code] = [];
    var msg = { from: "me", text: text, ts: Date.now() };
    threads[code].push(msg);
    saveThreads(threads);

    if (code === DEMO_BOT.code) {
      setTimeout(function () {
        var t2 = getThreads();
        t2[code].push({ from: "them", text: botReply(text), ts: Date.now() });
        saveThreads(t2);
        document.dispatchEvent(new CustomEvent("lunarium:chat-update", { detail: { code: code } }));
      }, 500 + Math.random() * 600);
    }
    return msg;
  }

  window.LunariumChat = {
    AVATAR_EMOJIS: AVATAR_EMOJIS,
    DEMO_BOT: DEMO_BOT,
    getProfile: getProfile,
    createProfile: createProfile,
    getContacts: getContacts,
    addContactByCode: addContactByCode,
    removeContact: removeContact,
    getThread: getThread,
    sendMessage: sendMessage
  };
})();
