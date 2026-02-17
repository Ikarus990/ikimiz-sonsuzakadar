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

  // sağ/sol baloncuk
  msg.classList.add(currentUser === "koca" ? "koca" : "masa");

  msg.innerHTML = `
    <div class="msg-who">${USERS[currentUser].label}</div>
    <div class="msg-text">${escapeHtml(text)}</div>
  `;

  chatBox.appendChild(msg);

  // ✅ gönderince input temizlensin
  input.value = "";
  input.focus();

  // en alta kaydır
  chatBox.scrollTop = chatBox.scrollHeight;
}

// küçük güvenlik: HTML kırılmasın
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
