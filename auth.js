// Shared auth + helpers for Bnt Baghdad (ES module). Used by index.html and products.html.
// Visitors sign up / log in with a USERNAME + PASSWORD only. Firebase Auth requires an email,
// so we auto-generate an internal email `<username>@bnt.local` behind the scenes. The username
// is what the user sees and types; the email is never shown.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCVTY96PC4-H34Azz8pwgzR_Rz6XDr-yc",
  authDomain: "bnt-baghdad.firebaseapp.com",
  databaseURL: "https://bnt-baghdad-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bnt-baghdad",
  storageBucket: "bnt-baghdad.firebasestorage.app",
  messagingSenderId: "3737016663",
  appId: "1:3737016663:web:e5bfd3b41cc56a85c28612",
  measurementId: "G-3K4TD674TG"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin is identified by the username "YOUNES". The Firebase account is created in the
// console with the email below + the password you chose (cat-mouse-dog-shin). Regular
// visitors get an auto-generated <username>@bnt.local email; the admin username maps to
// the real admin email so login stays username-only.
const EMAIL_DOMAIN = "bnt.local";
const ADMIN_EMAIL = "gsys12759@gmail.com";
const ADMIN_USERNAME = "YOUNES";
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

function toEmail(username) {
  const u = username.trim().toLowerCase();
  if (u === ADMIN_USERNAME.toLowerCase()) return ADMIN_EMAIL; // admin logs in with their real email
  return u + "@" + EMAIL_DOMAIN;
}
function isAdminUsername(name) { return name && name.toLowerCase() === ADMIN_USERNAME.toLowerCase(); }

// ── Public API ─────────────────────────────────────────────────────────────
export async function signUp(username, password) {
  username = (username || "").trim();
  if (!USERNAME_RE.test(username)) {
    throw new Error("Username may only contain letters, numbers, _ and - (no spaces).");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  // Enforce unique username (case-insensitive).
  const taken = await getDocs(query(collection(db, "users"), where("usernameLower", "==", username.toLowerCase())));
  if (!taken.empty) throw new Error("That username is already taken. Please choose another.");
  const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
  await setDoc(doc(db, "users", cred.user.uid), {
    username,
    usernameLower: username.toLowerCase(),
    role: "user",
    createdAt: serverTimestamp()
  });
  return cred.user;
}

export async function login(username, password) {
  username = (username || "").trim();
  return signInWithEmailAndPassword(auth, toEmail(username), password);
}

export function logout() { return signOut(auth); }

// Calls cb({ user, username, isAdmin }) whenever auth state changes. Also makes sure a
// users/{uid} doc exists (creating one for the admin console account if needed).
export function onUserChange(cb) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { cb({ user: null, username: null, isAdmin: false }); return; }
    let username = null, isAdmin = false;
    try {
      const ref = doc(db, "users", user.uid);
      let snap = await getDoc(ref);
      if (!snap.exists()) {
        // First login for this account — create its profile doc.
        if (user.email && user.email.toLowerCase() === ADMIN_EMAIL) {
          await setDoc(ref, { username: ADMIN_USERNAME, usernameLower: ADMIN_USERNAME.toLowerCase(), role: "admin", createdAt: serverTimestamp() });
        } else {
          await setDoc(ref, { username: user.email.split("@")[0], usernameLower: user.email.split("@")[0].toLowerCase(), role: "user", createdAt: serverTimestamp() });
        }
        snap = await getDoc(ref);
      }
      const data = snap.data() || {};
      username = data.username || user.email.split("@")[0];
      isAdmin = isAdminUsername(username);
    } catch (e) {
      console.error("onUserChange profile load failed:", e);
    }
    cb({ user, username, isAdmin });
  });
}

// ── Account UI (shared by both pages) ──────────────────────────────────────
// Any element with class "js-account" is an account trigger. When logged out it opens the
// login/sign-up modal; when logged in, clicking it logs the user out.
export function initAccountUI() {
  const triggers = Array.from(document.querySelectorAll(".js-account"));
  const modal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const errEl = document.getElementById("auth-err");
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const closeBtn = document.getElementById("login-close");

  function showTab(which) {
    const login = which === "login";
    if (tabLogin) tabLogin.classList.toggle("active", login);
    if (tabSignup) tabSignup.classList.toggle("active", !login);
    if (loginForm) loginForm.hidden = !login;
    if (signupForm) signupForm.hidden = login;
  }
  function openModal(tab) { if (modal) { modal.hidden = false; if (errEl) errEl.hidden = true; showTab(tab || "login"); } }
  function closeModal() { if (modal) { modal.hidden = true; if (loginForm) loginForm.reset(); if (signupForm) signupForm.reset(); } }
  function showErr(msg) { if (errEl) { errEl.hidden = false; errEl.textContent = msg; } }

  if (tabLogin) tabLogin.addEventListener("click", () => showTab("login"));
  if (tabSignup) tabSignup.addEventListener("click", () => showTab("signup"));
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  triggers.forEach(t => t.addEventListener("click", (e) => {
    e.preventDefault();
    if (auth.currentUser) {
      if (confirm("Log out?")) logout();
    } else {
      openModal("login");
    }
  }));

  if (loginForm) loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showErr("");
    try {
      await login(loginForm.username.value, loginForm.password.value);
      closeModal();
    } catch (err) {
      showErr(friendlyAuthError(err) || "Wrong username or password.");
    }
  });

  if (signupForm) signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showErr("");
    try {
      await signUp(signupForm.username.value, signupForm.password.value);
      closeModal();
    } catch (err) {
      showErr(friendlyAuthError(err) || (err && err.message) || "Sign up failed.");
    }
  });

  // Reflect state on all triggers.
  function render(user, username) {
    const label = user
      ? `<span class="lang-en-only">${escapeHtml(username || "Account")} · Logout</span><span class="lang-ar-only">${escapeHtml(username || "حساب")} · خروج</span>`
      : `<span class="lang-en-only">Login</span><span class="lang-ar-only">دخول</span>`;
    triggers.forEach(t => {
      const ni = t.querySelector(".ni");
      if (ni) { t.innerHTML = ni.outerHTML + " " + label; }
      else { t.innerHTML = label; }
    });
  }

  onUserChange(({ user, username }) => render(user, username));
}

function friendlyAuthError(err) {
  if (!err) return "";
  const code = err.code || "";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
    return "Wrong username or password.";
  if (code === "auth/email-already-in-use") return "That username is already taken.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email") return "Invalid username.";
  if (code === "auth/network-request-failed") return "Network error. Check your connection.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  return (err && err.message) ? String(err.message) : "";
}

// ── Image helper: compress a File to a base64 JPEG data URL ─────────────────
export function fileToCompressedDataURL(file, { maxW = 1000, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW) { height = Math.round(height * (maxW / width)); width = maxW; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        try { resolve(canvas.toDataURL("image/jpeg", quality)); }
        catch (e) { reject(e); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Keep the Firestore db reference available to pages that need it.
export { db, auth, ADMIN_USERNAME };
