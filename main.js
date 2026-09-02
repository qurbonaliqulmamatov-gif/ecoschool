import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyDDpwBNGZWz4khsx7walCPRwr2q0x227ds",
  authDomain: "enter-4444.firebaseapp.com",
  databaseURL: "https://enter-4444-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "enter-4444",
  storageBucket: "enter-4444.firebasestorage.app",
  messagingSenderId: "137628534597",
  appId: "1:137628534597:web:5dc8a0c1a5e0b70186602c",
  measurementId: "G-K12LRQ0EC2"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global holat
let currentUserData = null;

// Authentifikatsiya tinglovchisi va sahifalarni muhofaza qilish
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  const isAuthPage = path.includes("login.html") || path.includes("register.html");

  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      currentUserData = userDoc.data();
      updateUIHeader();
    }
    if (isAuthPage) {
      window.location.href = "index.html";
    }
  } else {
    currentUserData = null;
    if (!isAuthPage && !path.includes("index.html") && path !== "/") {
      window.location.href = "login.html";
    }
  }
});

// UI Header (Simvollar balansi) update
function updateUIHeader() {
  const symbolElement = document.getElementById("user-symbols");
  if (symbolElement && currentUserData) {
    symbolElement.textContent = currentUserData.symbols || 0;
  }
}

// Ro'yxatdan o'tish (Register)
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        symbols: 10,
        createdAt: new Date()
      });

      window.location.href = "index.html";
    } catch (error) {
      alert("Xatolik yuz berdi: " + error.message);
    }
  });
}

// Tizimga kirish (Login)
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (error) {
      alert("Kirishda xatolik: " + error.message);
    }
  });
}

// Chiqish (Logout)
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  });
}

// Eco-Chat real-vaqt rejimida yozishmalarni ko'rsatish
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
if (chatBox && chatForm) {
  const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const msgElement = document.createElement("div");
      msgElement.className = "chat-message";
      msgElement.innerHTML = `<strong>${msg.senderName}:</strong> ${msg.text}`;
      chatBox.appendChild(msgElement);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const chatInput = document.getElementById("chat-input");
    const text = chatInput.value.trim();

    if (text && auth.currentUser && currentUserData) {
      if (currentUserData.symbols < 1) {
        alert("Xabar yuborish uchun kamida 1 ta simvol kerak!");
        return;
      }

      await addDoc(collection(db, "chats"), {
        senderId: auth.currentUser.uid,
        senderName: currentUserData.name,
        text: text,
        timestamp: new Date()
      });

      const newSymbols = currentUserData.symbols - 1;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        symbols: newSymbols
      });
      currentUserData.symbols = newSymbols;
      updateUIHeader();

      chatInput.value = "";
    }
  });
}

// Yangi Eko-Loyiha qo'shish
const newProjectForm = document.getElementById("new-project-form");
if (newProjectForm) {
  newProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("proj-title").value;
    const desc = document.getElementById("proj-desc").value;

    if (auth.currentUser && currentUserData) {
      try {
        await addDoc(collection(db, "projects"), {
          title: title,
          description: desc,
          authorId: auth.currentUser.uid,
          authorName: currentUserData.name,
          createdAt: new Date()
        });

        alert("Loyiha muvaffaqiyatli qo'shildi!");
        window.location.href = "projects.html";
      } catch (err) {
        alert("Loyihani saqlashda xatolik: " + err.message);
      }
    }
  });
}
