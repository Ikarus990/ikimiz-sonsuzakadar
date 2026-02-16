import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtmXU5iEhJVTLFz9nhTOjfsclxfynhM3Q",
  authDomain: "ikimiz-sonsuzakadar.firebaseapp.com",
  projectId: "ikimiz-sonsuzakadar",
  storageBucket: "ikimiz-sonsuzakadar.firebasestorage.app",
  messagingSenderId: "849349503146",
  appId: "1:849349503146:web:7d3af60830496e913ec8d3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const messagesRef = collection(db, "messages");

const chatBox = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Kullanıcıyı cihaz bazlı belirle
let user = localStorage.getItem("user");

if (!user) {
  user = prompt("Sen kimsin? Maşa mı Koca Ayı mı?");
  localStorage.setItem("user", user);
}

// Mesaj gönderme
sendBtn.addEventListener("click", async () => {
  if (input.value.trim() === "") return;

  await addDoc(messagesRef, {
    text: input.value,
    sender: user,
    createdAt: new Date()
  });

  input.value = ""; // input temizleme
});

// Gerçek zamanlı dinleme
const q = query(messagesRef, orderBy("createdAt"));

onSnapshot(q, (snapshot) => {
  chatBox.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();

    const div = document.createElement("div");
    div.classList.add("message");

    if (data.sender === user) {
      div.classList.add("me");
    } else {
      div.classList.add("other");
    }

    div.innerHTML = `
      <strong>${data.sender}</strong><br>
      ${data.text}
    `;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
