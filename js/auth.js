// ============================================
// Auth — Sign Up, Log In, Log Out, Session
// ============================================

// ---- Toast Notification ----
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// ---- Modal helpers ----
function showAuthModal(tab = "signup") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("visible");
  switchTab(tab);
  // Focus first input
  setTimeout(() => {
    const input = tab === "signup"
      ? document.getElementById("signupEmail")
      : document.getElementById("loginEmail");
    if (input) input.focus();
  }, 100);
}

function hideAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("visible");
}

function closeAuthModal(e) {
  if (e.target.id === "authModal") hideAuthModal();
}

function switchTab(tab) {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const signupTab = document.getElementById("signupTab");
  const loginTab = document.getElementById("loginTab");
  if (!signupForm) return;

  if (tab === "signup") {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
  } else {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
  }
  clearErrors();
}

function clearErrors() {
  const se = document.getElementById("signupError");
  const le = document.getElementById("loginError");
  if (se) se.textContent = "";
  if (le) le.textContent = "";
}

// ---- Set button loading state ----
function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : defaultText;
  btn.style.opacity = loading ? "0.7" : "1";
}

// ---- Wait for Supabase to load ----
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window._supabase) return resolve(window._supabase);
    window.addEventListener("supabaseReady", () => resolve(window._supabase), { once: true });
  });
}

// ---- Sign Up ----
async function handleSignup() {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const errorEl = document.getElementById("signupError");

  if (!email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }
  if (password.length < 8) {
    errorEl.textContent = "Password must be at least 8 characters.";
    return;
  }

  setLoading("signupBtn", true, "Create Account →");
  errorEl.textContent = "";

  try {
    const sb = await waitForSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    if (data.user) {
      hideAuthModal();
      showToast("✅ Account created! Redirecting...");
      setTimeout(() => redirectToDashboard(), 800);
    }
  } catch (err) {
    errorEl.textContent = "Something went wrong. Try again.";
    console.error(err);
  } finally {
    setLoading("signupBtn", false, "Create Account →");
  }
}

// ---- Log In ----
async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  if (!email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  setLoading("loginBtn", true, "Log In →");
  errorEl.textContent = "";

  try {
    const sb = await waitForSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    if (data.user) {
      hideAuthModal();
      showToast("👋 Welcome back!");
      setTimeout(() => redirectToDashboard(), 500);
    }
  } catch (err) {
    errorEl.textContent = "Something went wrong. Try again.";
    console.error(err);
  } finally {
    setLoading("loginBtn", false, "Log In →");
  }
}

// ---- Log Out ----
async function handleLogout() {
  const sb = await waitForSupabase();
  await sb.auth.signOut();
  showToast("Signed out. See you next time!");
  setTimeout(() => {
    const isInPages = window.location.pathname.includes("/pages/");
    window.location.href = isInPages ? "../index.html" : "index.html";
  }, 800);
}

// ---- Redirect to Dashboard ----
function redirectToDashboard() {
  const isInPages = window.location.pathname.includes("/pages/");
  window.location.href = isInPages ? "dashboard.html" : "pages/dashboard.html";
}

// ---- Check session on page load ----
async function checkSession() {
  const isDashboard = window.location.pathname.includes("dashboard");

  try {
    const sb = await waitForSupabase();
    const { data: { session } } = await sb.auth.getSession();

    if (isDashboard && !session) {
      // Not logged in — redirect to home
      window.location.href = "../index.html";
    } else if (!isDashboard && session) {
      // Already logged in — redirect to dashboard
      redirectToDashboard();
    }

    return session;
  } catch (err) {
    console.warn("Session check error:", err);
    return null;
  }
}

// ---- Hero quick start ----
function heroQuickStart() {
  const prompt = document.getElementById("heroPrompt").value.trim();
  if (!prompt) {
    showToast("💡 Type a prompt first!");
    return;
  }

  // Store the prompt so dashboard can pick it up
  sessionStorage.setItem("pendingPrompt", prompt);
  showAuthModal("signup");
}

// Run session check automatically
document.addEventListener("DOMContentLoaded", () => {
  waitForSupabase().then(() => checkSession());
});
