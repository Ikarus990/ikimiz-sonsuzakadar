import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ✅ Firebase config (senin)
const firebaseConfig = {
  apiKey: "AIzaSyCtmXU5iEhJVTLFz9nhTOjfsclxfynhM3Q",
  authDomain: "ikimiz-sonsuzakadar.firebaseapp.com",
  projectId: "ikimiz-sonsuzakadar",
  storageBucket: "ikimiz-sonsuzakadar.firebasestorage.app",
  messagingSenderId: "849349503146",
  appId: "1:849349503146:web:7d3af60830496e913ec8d3",
  measurementId: "G-0NJT5GV74Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- UI ---
const loginBox = document.getElementById("loginBox");
const chatBox = document.getElementById("chatBox");
const passInput = document.getElementById("passInput");
const loginBtn = document.getElementById("loginBtn");
const loginErr = document.getElementById("loginErr");
const logoutBtn = document.getElementById("logoutBtn");

const whoAmI = document.getElementById("whoAmI");
const messagesEl = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

const counterEl = document.getElementById("counter");

// --- Sayaç ---
const startDate = new Date("2025-07-21T00:00:00");
function updateCounter() {
  const now = new Date();
  const diff = now - startDate;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  counterEl.textContent = `${days} gün ${hours} saat ${mins} dakika`;
}
setInterval(updateCounter, 1000);
updateCounter();

// --- Kimlik (Şifre -> kişi) ---
// ✅ Şifreler BURADA. (Birebir aynı yazılmalı, büyük/küçük harf dahil)
const PASS_TO_USER = {
  "ikimiz-sonsuzakadar": { id: "koca", name: "🐻 Koca Ayı" },
  "SerFer-21.07.2025":  { id: "masa", name: "🧸 Maşa" }
};

function setUser(user) {
  localStorage.setItem("ikimiz_user", JSON.stringify(user));
  whoAmI.textContent = `Sohbet - ${user.name}`;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("ikimiz_user")); }
  catch { return null; }
}

function showChat() {
  loginBox.classList.add("hidden");
  chatBox.classList.remove("hidden");
  msgInput.focus();
}

function showLogin() {
  chatBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
  passInput.value = "";
  passInput.focus();
}

function doLogin() {
  loginErr.textContent = "";
  const pass = (passInput.value || "").trim();
  const user = PASS_TO_USER[pass];
  if (!user) {
    loginErr.textContent = "Şifre yanlış. Tekrar dene.";
    return;
  }
  setUser(user);
  showChat();
}

loginBtn.addEventListener("click", doLogin);
passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("ikimiz_user");
  showLogin();
});

// --- Firestore: Mesajlar ---
const msgsRef = collection(db, "messages");
const q = query(msgsRef, orderBy("createdAt", "asc"));

function formatTime(ts) {
  try {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMessage(docData) {
  const user = getUser();
  const mine = user && docData.senderId === user.id;

  const row = document.createElement("div");
  row.className = `msgRow ${mine ? "me" : "other"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = docData.senderName || "Bilinmeyen";

  const text = document.createElement("div");
  text.innerHTML = escapeHtml(docData.text || "");

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = formatTime(docData.createdAt);

  bubble.appendChild(meta);
  bubble.appendChild(text);
  bubble.appendChild(time);

  row.appendChild(bubble);
  return row;
}

onSnapshot(q, (snap) => {
  messagesEl.innerHTML = "";
  snap.forEach((d) => {
    const data = d.data();
    messagesEl.appendChild(renderMessage(data));
  });
  // En alta kaydır
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

async function sendMessage() {
  const user = getUser();
  if (!user) {
    showLogin();
    return;
  }

  const text = (msgInput.value || "").trim();
  if (!text) return;

  // ✅ Gönderince input temizlensin
  msgInput.value = "";
  msgInput.focus();

  await addDoc(msgsRef, {
    text,
    senderId: user.id,
    senderName: user.name,
    createdAt: serverTimestamp()
  });
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Sayfa açılınca: kullanıcı varsa direkt sohbet, yoksa giriş
if (getUser()) showChat();
else showLogin();