"use strict";

/* ------------------------------------------------------------------ */
/* ASO Users access                                                   */
/*                                                                    */
/* This is a client-side access gate, not server-side authentication. */
/* Credentials and permissions can be changed in AUTH_ACCOUNTS below. */
/* ------------------------------------------------------------------ */

const AUTH_STORAGE_KEY = "stockroom.auth.v1";
const LOGIN_DOCUMENT_TITLE = "Sign in · Stock Management System — ASO Inventory Control";

const AUTH_ACCOUNTS = [
  {
    username: "aso.admin",
    password: "Admin@2026",
    name: "Khushal Bhatia.1",
    role: "Administrator",
    initials: "KB",
    isAdmin: true,
    canManageData: true
  },
  {
    username: "aso.user",
    password: "Stock@2026",
    name: "ASO",
    role: "Stock operator",
    initials: "AS",
    isAdmin: false,
    canManageData: true
  }
];

let currentUser = null;

function findAccount(username) {
  return AUTH_ACCOUNTS.find((account) => account.username === String(username || "").trim().toLowerCase()) || null;
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && typeof session.username === "string" ? session : null;
  } catch (error) {
    console.warn("Could not read the sign-in session.", error);
    return null;
  }
}

function saveSession(account) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      username: account.username,
      isAdmin: Boolean(account.isAdmin),
      signedInAt: new Date().toISOString()
    }));
  } catch (error) {
    console.warn("Could not save the sign-in session.", error);
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear the sign-in session.", error);
  }
}

function authenticate(username, password) {
  const account = findAccount(username);
  return account && account.password === password ? account : null;
}

function canManageData() {
  return Boolean(currentUser && currentUser.canManageData);
}

function isAdministrator() {
  return Boolean(currentUser && currentUser.isAdmin);
}

function actorName() {
  return currentUser ? currentUser.name : "Unknown user";
}

function applyUserChrome() {
  if (!currentUser) return;
  document.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = currentUser.name; });
  document.querySelectorAll("[data-user-initials]").forEach((element) => { element.textContent = currentUser.initials; });
  document.querySelectorAll("[data-user-role]").forEach((element) => { element.textContent = currentUser.role; });
  document.querySelectorAll("[data-user-scope]").forEach((element) => { element.textContent = "ASO Users"; });
  document.querySelectorAll("[data-user-username]").forEach((element) => { element.textContent = currentUser.username; });

  const accountButton = document.querySelector("[data-action='toggle-account']");
  if (accountButton) {
    accountButton.setAttribute("aria-label", `Account menu for ${currentUser.initials}, ${currentUser.name}, ${currentUser.role}`);
    accountButton.title = `${currentUser.name} · ${currentUser.role}`;
  }
  document.body.dataset.authRole = currentUser.isAdmin ? "admin" : "aso";
}

function showLoginGate() {
  const gate = document.getElementById("login-gate");
  const app = document.getElementById("app-shell");
  if (gate) gate.hidden = false;
  if (app) app.hidden = true;
  document.title = LOGIN_DOCUMENT_TITLE;
}

function showPortal() {
  const gate = document.getElementById("login-gate");
  const app = document.getElementById("app-shell");
  if (gate) gate.hidden = true;
  if (app) app.hidden = false;
}

function setLoginError(message) {
  const error = document.getElementById("login-error");
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
}

function completeSignIn(account) {
  currentUser = account;
  saveSession(account);
  showPortal();
  applyUserChrome();
  document.dispatchEvent(new CustomEvent("auth:success"));
}

function wireLogin() {
  const form = document.getElementById("login-form");
  const username = document.getElementById("login-username");
  const password = document.getElementById("login-password");
  const passwordToggle = document.querySelector("[data-action='toggle-password']");
  if (!form || !username || !password) return;

  document.title = LOGIN_DOCUMENT_TITLE;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const account = authenticate(username.value, password.value);
    if (!account) {
      setLoginError("Incorrect username or password. Please try again.");
      username.setAttribute("aria-invalid", "true");
      password.setAttribute("aria-invalid", "true");
      password.value = "";
      password.focus();
      return;
    }
    setLoginError("");
    const submit = form.querySelector("button[type='submit']");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Signing in…";
    }
    completeSignIn(account);
  });

  [username, password].forEach((input) => {
    input.addEventListener("input", () => {
      setLoginError("");
      username.removeAttribute("aria-invalid");
      password.removeAttribute("aria-invalid");
    });
  });

  passwordToggle?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    passwordToggle.textContent = showing ? "Show" : "Hide";
    passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    passwordToggle.setAttribute("aria-pressed", String(!showing));
    password.focus();
  });
}

function initAuth() {
  const session = readSession();
  const account = session ? findAccount(session.username) : null;
  if (!account) {
    if (session) clearSession();
    showLoginGate();
    wireLogin();
    return false;
  }
  currentUser = account;
  showPortal();
  applyUserChrome();
  return true;
}

function signOut() {
  clearSession();
  currentUser = null;
  window.location.reload();
}
