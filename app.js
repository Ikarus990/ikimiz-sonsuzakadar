// =====================
// 1) ŞİFRELER (BURASI)
// =====================
const PASS_KOCA = "ikimiz-sonsuzakadar";
const PASS_MASA = "SerFer-21.07.2025";

// Kullanıcı rolleri
const USERS = {
  koca: { label: "🐻 Koca Ayı" },
  masa: { label: "🔍 Maşa" } // emoji istersen değiştir: 🧸🍳🔎 vs.
};

let currentUser = null;

// =====================
// 2) GİRİŞ / HATIRLAMA
// =====================
function setUser(userKey) {
  currentUser = userKey;
  localStorage.setItem("ikimiz_user", userKey); // ✅ tekrar girince hatırlasın
}

function showChatHideLogin() {
  const login = document.getElementById("loginScreen");
  if (login) login.style.display = "none";

  const input = document.getElementById("messageInput");
  if (input) input.focus();
}

function showLogin() {
  const login = document.getElementById("loginScreen");
  if (login) login.style.display = "flex";
}

function loginWithPassword() {
  const passInput = document.getElementById("passInput");
  const err = document.getElementById("loginError");

  const pass = (passInput?.value || "").trim();

  if (pass === PASS_KOCA) {
    setUser("koca");
  } else if (pass === PASS_MASA) {
    setUser("masa");
  } else {
    if (err) err.textContent = "❌ Şifre yanlış. Tekrar dene.";
    return;
  }

  if (err) err.textContent = "";
  if (passInput) passInput.value = ""; // ✅ şifre kutusu temizlensin
  showChatHideLogin();
}

function logout() {
  localStorage.removeItem("ikimiz_user");
  currentUser = null;
  showLogin();
}

// Sayfa açılınca: daha önce giren kişiyi hatırla
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("ikimiz_user");
  if (saved === "koca" || saved === "masa") {
    currentUser = saved;
    showChatHideLogin();
  } else {
    showLogin();
  }

  const btn = document.getElementById("loginBtn");
  const passInput = document.getElementById("passInput");

  if (btn) btn.addEventListener("click", loginWithPassword);
  if (passInput) {
    passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginWithPassword();
    });
  }

  // Mesaj kutusunda Enter ile gönder
  const msgInput = document.getElementById("messageInput");
  if (msgInput) {
    msgInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
});

// =====================
// 3) MESAJ GÖNDERME
// =====================
function sendMessage() {
  const input = document.getElementById("messageInput");
  const chatBox = document.getElementById("chatBox");
  if (!input || !chatBox) return;

  const text = input.value.trim();
  if (!text) return;

  if (!currentUser) {
    alert("Önce şifre ile giriş yapmalısın.");
    return;
  }

  const msg = document.createElement("div");
  msg.classList.add("message");

 // =====================
// AYARLAR
// =====================
const START_DATE = "2025-07-21T00:00:00";

// Şifre -> kullanıcı bilgisi
const USERS = {
  "ikimiz-sonsuzakadar": { name: "🐻 Koca Ayı" },
  "SerFer-21.07.2025":  { name: "🧸 Maşa" }
};

// =====================
// SAYFA ELEMANLARI
// =====================
const counterEl = document.getElementById("counter");

const loginCard = document.getElementById("loginCard");
const passInput = document.getElementById("passInput");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const chatCard = document.getElementById("chatCard");
const chatHeader = document.getElementById("chatHeader");
const messagesEl = document.getElementById("messages");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");

// =====================
// SAYAÇ
// =====================
function updateCounter() {
  const start = new Date(START_DATE);
  const now = new Date();
  const diff = now - start;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  counterEl.textContent = `${days} gün ${hours} saat ${minutes} dakika`;
}
setInterval(updateCounter, 1000);
updateCounter();

// =====================
// MESAJLAR (şimdilik localStorage)
// =====================
const STORAGE_KEY = "ikimiz_chat_messages_v1";
const WHO_KEY = "ikimiz_who_v1";

function loadMessages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}
function saveMessages(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function renderMessages() {
  const msgs = loadMessages();
  messagesEl.innerHTML = "";

  for (const m of msgs) {
    const row = document.createElement("div");
    row.className = "bubbleRow " + (m.side === "right" ? "right" : "left");

    const bubble = document.createElement("div");
    bubble.className = "bubble " + (m.side === "right" ? "me" : "");

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = m.from;

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = m.text;

    bubble.appendChild(meta);
    bubble.appendChild(text);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
  }

  // en alta kaydır
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// =====================
// GİRİŞ / KİMİM?
// =====================
let currentUser = null;

function setUserByPassword(pass) {
  const user = USERS[pass];
  if (!user) return false;

  currentUser = user;
  localStorage.setItem(WHO_KEY, pass);

  // UI
  loginCard.classList.add("hidden");
  chatCard.classList.remove("hidden");
  chatHeader.textContent = `Sohbet - ${user.name}`;

  renderMessages();
  return true;
}

function autoLoginIfRemembered() {
  const saved = localStorage.getItem(WHO_KEY);
  if (saved && USERS[saved]) {
    setUserByPassword(saved);
  }
}
autoLoginIfRemembered();

loginBtn.addEventListener("click", () => {
  const pass = passInput.value.trim();
  if (setUserByPassword(pass)) {
    loginMsg.textContent = "";
    passInput.value = "";
  } else {
    loginMsg.textContent = "Şifre yanlış. Tekrar dene.";
  }
});

passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// =====================
// MESAJ GÖNDER
// =====================
function sendMessage() {
  if (!currentUser) {
    loginMsg.textContent = "Önce giriş yapmalısın.";
    return;
  }

  const text = textInput.value.trim();
  if (!text) return;

  // Sağ/sol baloncuk: kendi mesajın sağda
  const myName = currentUser.name;

  const msgs = loadMessages();
  msgs.push({
    from: myName,
    text,
    side: "right",
    at: Date.now()
  });

  saveMessages(msgs);
  renderMessages();

  // ✅ Gönderince input temizlensin
  textInput.value = "";
  textInput.focus();
}

sendBtn.addEventListener("click", sendMessage);
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});