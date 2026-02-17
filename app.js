// Firebase (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  limit
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

// ==== Firebase config (senin config'in) ====
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ==== UI refs ====
const counterEl = document.getElementById("counter");

const authCard = document.getElementById("authCard");
const appCard = document.getElementById("appCard");
const authErr = document.getElementById("authErr");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnReset = document.getElementById("btnReset");

const meAvatar = document.getElementById("meAvatar");
const meName = document.getElementById("meName");
const meEmail = document.getElementById("meEmail");
const btnSignOut = document.getElementById("btnSignOut");

const tabs = document.querySelectorAll(".tab");
const panes = {
  chat: document.getElementById("tab-chat"),
  gallery: document.getElementById("tab-gallery"),
  memories: document.getElementById("tab-memories"),
  journal: document.getElementById("tab-journal"),
};

const messagesEl = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

const filePicker = document.getElementById("filePicker");
const uploadBtn = document.getElementById("uploadBtn");
const uploadInfo = document.getElementById("uploadInfo");
const galleryEl = document.getElementById("gallery");

const memTitle = document.getElementById("memTitle");
const memText = document.getElementById("memText");
const memAdd = document.getElementById("memAdd");
const memList = document.getElementById("memList");
const memErr = document.getElementById("memErr");

const journalText = document.getElementById("journalText");
const journalSave = document.getElementById("journalSave");
const journalSaved = document.getElementById("journalSaved");
const journalErr = document.getElementById("journalErr");

// ==== Romantic identity (email'e göre emoji/ad) ====
function identityFromEmail(email){
  const e = (email || "").toLowerCase();
  // İstersen burada maşa emailini ekleyince otomatik tanır:
  if (e.includes("serhat")) return { name: "Koca Ayı", emoji: "🐻" };
  return { name: "Maşa", emoji: "🧸" };
}

// ==== Counter ====
const startDate = new Date("2025-07-21T00:00:00");
function updateCounter(){
  const now = new Date();
  const diff = now - startDate;
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  counterEl.textContent = `${days} gün ${hours} saat ${mins} dakika`;
}
setInterval(updateCounter, 1000);
updateCounter();

// ==== Tabs ====
tabs.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");

    const key = btn.dataset.tab;
    Object.values(panes).forEach(p=>p.classList.add("hidden"));
    panes[key].classList.remove("hidden");
  });
});

// ==== Auth actions ====
btnLogin.addEventListener("click", async ()=>{
  authErr.textContent = "";
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if(!email || !pass){ authErr.textContent = "Email ve şifre gir."; return; }

  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(e){
    authErr.textContent = "Giriş başarısız. Email/şifre yanlış olabilir veya kullanıcı ekli değildir.";
  }
});

btnRegister.addEventListener("click", async ()=>{
  authErr.textContent = "";
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if(!email || !pass){ authErr.textContent = "Email ve şifre gir."; return; }

  try{
    await createUserWithEmailAndPassword(auth, email, pass);
  }catch(e){
    authErr.textContent = "Kayıt açılamadı. Bu email zaten kayıtlı olabilir veya şifre çok zayıf.";
  }
});

btnReset.addEventListener("click", async ()=>{
  authErr.textContent = "";
  const email = emailEl.value.trim();
  if(!email){ authErr.textContent = "Şifre sıfırlamak için email gir."; return; }
  try{
    await sendPasswordResetEmail(auth, email);
    authErr.style.color = "var(--ok)";
    authErr.textContent = "Şifre sıfırlama maili gönderildi.";
    setTimeout(()=>{ authErr.style.color=""; }, 1800);
  }catch(e){
    authErr.textContent = "Mail gönderilemedi. Email doğru mu?";
  }
});

btnSignOut.addEventListener("click", ()=>signOut(auth));

// ==== Firestore refs ====
const messagesCol = collection(db, "messages");
const mediaCol = collection(db, "media");
const memoriesCol = collection(db, "memories");

// ==== Live listeners (auth sonrası açılacak) ====
let unsubMessages = null;
let unsubMedia = null;
let unsubMemories = null;

function renderMessage({id, text, whoName, whoEmoji, uid, createdAt}, myUid){
  const wrap = document.createElement("div");
  wrap.className = "bubble" + (uid === myUid ? " me" : "");

  const meta = document.createElement("div");
  meta.className = "meta";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = `${whoEmoji} ${whoName}`;

  const time = document.createElement("span");
  time.className = "muted";
  time.textContent = createdAt ? new Date(createdAt).toLocaleString("tr-TR") : "";

  meta.appendChild(tag);
  meta.appendChild(time);

  const body = document.createElement("div");
  body.className = "text";
  body.textContent = text;

  wrap.appendChild(meta);
  wrap.appendChild(body);
  return wrap;
}

function scrollBottom(){
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setLoggedInUI(user){
  const ident = identityFromEmail(user.email);
  meAvatar.textContent = ident.emoji;
  meName.textContent = ident.name;
  meEmail.textContent = user.email;

  authCard.classList.add("hidden");
  appCard.classList.remove("hidden");
}

function setLoggedOutUI(){
  authCard.classList.remove("hidden");
  appCard.classList.add("hidden");
}

function attachListeners(user){
  // Chat
  if(unsubMessages) unsubMessages();
  const qMsg = query(messagesCol, orderBy("createdAt", "asc"), limit(200));
  unsubMessages = onSnapshot(qMsg, snap=>{
    messagesEl.innerHTML = "";
    snap.forEach(docu=>{
      const d = docu.data();
      const node = renderMessage({
        id: docu.id,
        text: d.text || "",
        whoName: d.whoName || "—",
        whoEmoji: d.whoEmoji || "💫",
        uid: d.uid || "",
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : null
      }, user.uid);
      messagesEl.appendChild(node);
    });
    scrollBottom();
  });

  // Gallery
  if(unsubMedia) unsubMedia();
  const qMedia = query(mediaCol, orderBy("createdAt", "desc"), limit(60));
  unsubMedia = onSnapshot(qMedia, async snap=>{
    galleryEl.innerHTML = "";
    for(const docu of snap.docs){
      const d = docu.data();
      const card = document.createElement("div");
      card.className = "mediaCard";

      const isVideo = (d.type || "").startsWith("video/");
      const media = document.createElement(isVideo ? "video" : "img");
      if(isVideo){
        media.controls = true;
        media.src = d.url;
      }else{
        media.src = d.url;
        media.loading = "lazy";
      }

      const info = document.createElement("div");
      info.className = "mediaInfo";

      const left = document.createElement("div");
      left.className = "muted tiny";
      left.textContent = `${d.whoEmoji || "💫"} ${d.whoName || "—"}`;

      const link = document.createElement("a");
      link.href = d.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "İndir";

      info.appendChild(left);
      info.appendChild(link);

      card.appendChild(media);
      card.appendChild(info);
      galleryEl.appendChild(card);
    }
  });

  // Memories
  if(unsubMemories) unsubMemories();
  const qMem = query(memoriesCol, orderBy("createdAt", "desc"), limit(60));
  unsubMemories = onSnapshot(qMem, snap=>{
    memList.innerHTML = "";
    snap.forEach(docu=>{
      const d = docu.data();
      const item = document.createElement("div");
      item.className = "memItem";
      item.innerHTML = `
        <div class="t">${escapeHtml(d.title || "—")}</div>
        <div class="d">${escapeHtml(d.text || "")}</div>
        <div class="d">${(d.whoEmoji||"💫")} ${(d.whoName||"—")} • ${d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString("tr-TR") : ""}</div>
      `;
      memList.appendChild(item);
    });
  });

  // Journal (tek doküman)
  loadJournal();
}

function detachListeners(){
  if(unsubMessages) unsubMessages(); unsubMessages=null;
  if(unsubMedia) unsubMedia(); unsubMedia=null;
  if(unsubMemories) unsubMemories(); unsubMemories=null;
}

function escapeHtml(s){
  return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// ==== Chat send ====
async function sendMessage(){
  const text = msgInput.value.trim();
  if(!text) return;

  const user = auth.currentUser;
  if(!user) return;

  const ident = identityFromEmail(user.email);

  sendBtn.disabled = true;
  try{
    await addDoc(messagesCol, {
      text,
      uid: user.uid,
      whoName: ident.name,
      whoEmoji: ident.emoji,
      createdAt: serverTimestamp()
    });
    msgInput.value = ""; // gönderince temizle
    msgInput.focus();
  }catch(e){
    // sessiz geç
  }finally{
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") sendMessage();
});

// ==== Gallery upload ====
async function uploadMedia(){
  const user = auth.currentUser;
  if(!user) return;

  const file = filePicker.files?.[0];
  if(!file){ uploadInfo.textContent = "Dosya seç."; return; }

  // Dosya limiti (Spark plan için güvenli olsun)
  const maxMB = 50;
  if(file.size > maxMB * 1024 * 1024){
    uploadInfo.textContent = `Dosya çok büyük. Max ${maxMB}MB.`;
    return;
  }

  const ident = identityFromEmail(user.email);
  uploadBtn.disabled = true;
  uploadInfo.textContent = "Yükleniyor...";

  try{
    const ext = file.name.split(".").pop() || "bin";
    const path = `media/${Date.now()}_${user.uid}.${ext}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(mediaCol, {
      url,
      path,
      type: file.type || "application/octet-stream",
      uid: user.uid,
      whoName: ident.name,
      whoEmoji: ident.emoji,
      createdAt: serverTimestamp()
    });

    filePicker.value = "";
    uploadInfo.textContent = "Yüklendi ✅";
  }catch(e){
    uploadInfo.textContent = "Yükleme başarısız. Storage açık mı? (Firebase Storage > Get started)";
  }finally{
    uploadBtn.disabled = false;
    setTimeout(()=>{ uploadInfo.textContent=""; }, 1600);
  }
}

uploadBtn.addEventListener("click", uploadMedia);

// ==== Memories add ====
memAdd.addEventListener("click", async ()=>{
  memErr.textContent = "";
  const user = auth.currentUser;
  if(!user) return;

  const title = memTitle.value.trim();
  const text = memText.value.trim();
  if(!title || !text){ memErr.textContent = "Başlık ve açıklama yaz."; return; }

  const ident = identityFromEmail(user.email);
  memAdd.disabled = true;
  try{
    await addDoc(memoriesCol, {
      title, text,
      uid: user.uid,
      whoName: ident.name,
      whoEmoji: ident.emoji,
      createdAt: serverTimestamp()
    });
    memTitle.value = "";
    memText.value = "";
  }catch(e){
    memErr.textContent = "Anı kaydedilemedi (Firestore açık mı?).";
  }finally{
    memAdd.disabled = false;
  }
});

// ==== Journal (single doc) ====
const journalDoc = doc(db, "journal", "main");

async function loadJournal(){
  journalErr.textContent = "";
  journalSaved.textContent = "";
  try{
    const snap = await getDoc(journalDoc);
    if(snap.exists()){
      journalText.value = snap.data().text || "";
    }else{
      journalText.value = "";
    }
  }catch(e){
    journalErr.textContent = "Günlük okunamadı (Firestore).";
  }
}

journalSave.addEventListener("click", async ()=>{
  journalErr.textContent = "";
  journalSaved.textContent = "";
  const user = auth.currentUser;
  if(!user) return;

  const ident = identityFromEmail(user.email);
  journalSave.disabled = true;
  try{
    await setDoc(journalDoc, {
      text: journalText.value || "",
      updatedAt: serverTimestamp(),
      updatedBy: { uid:user.uid, whoName: ident.name, whoEmoji: ident.emoji }
    }, { merge:true });

    journalSaved.textContent = "Kaydedildi ✅";
    setTimeout(()=>{ journalSaved.textContent=""; }, 1600);
  }catch(e){
    journalErr.textContent = "Kaydedilemedi (Firestore).";
  }finally{
    journalSave.disabled = false;
  }
});

// ==== Auth state ====
onAuthStateChanged(auth, (user)=>{
  if(user){
    setLoggedInUI(user);
    attachListeners(user);
  }else{
    detachListeners();
    setLoggedOutUI();
  }
});