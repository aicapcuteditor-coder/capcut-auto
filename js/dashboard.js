// ============================================
// Dashboard — AI Plan Generation + History
// Using OpenRouter API
// ============================================

const OPENROUTER_API_KEY = "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"; // paste your sk-or-... key here
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

let currentStyle = "cinematic";
let currentPlanText = "";
let currentUser = null;
let savedPlans = [];

const loadingMessages = [
  "Analyzing your edit request...",
  "Building your CapCut workflow...",
  "Crafting step-by-step instructions...",
  "Almost ready..."
];

// ---- Init ----
window.addEventListener("supabaseReady", async () => {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    window.location.href = "../index.html";
    return;
  }

  currentUser = session.user;
  initUserUI(currentUser);
  loadHistory();

  const pending = sessionStorage.getItem("pendingPrompt");
  if (pending) {
    sessionStorage.removeItem("pendingPrompt");
    document.getElementById("promptInput").value = pending;
    updateCharCount();
    setTimeout(() => generatePlan(), 300);
  }
});

// ---- User UI ----
function initUserUI(user) {
  const email = user.email || "User";
  const initial = email[0].toUpperCase();
  document.getElementById("userEmail").textContent = email;
  document.getElementById("userAvatar").textContent = initial;
}

// ---- Navigation ----
document.querySelectorAll(".side-link[data-view]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

function switchView(view) {
  document.querySelectorAll(".dash-view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".side-link[data-view]").forEach(l => l.classList.remove("active"));
  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add("active");
  const link = document.querySelector(`.side-link[data-view="${view}"]`);
  if (link) link.classList.add("active");
  if (view === "history") renderHistory();
}

// ---- Style Chips ----
function setStyle(btn, style) {
  document.querySelectorAll(".style-chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  currentStyle = style;
}

// ---- Char Counter ----
const textarea = document.getElementById("promptInput");
if (textarea) textarea.addEventListener("input", updateCharCount);

function updateCharCount() {
  const ta = document.getElementById("promptInput");
  const cc = document.getElementById("charCount");
  if (!ta || !cc) return;
  const len = ta.value.length;
  cc.textContent = `${len} / 500`;
  cc.style.color = len > 450 ? "#fc5c7c" : "var(--text-muted)";
}

function handlePromptKey(e) {
  if (e.ctrlKey && e.key === "Enter") generatePlan();
}

// ---- Generate Plan ----
async function generatePlan() {
  const prompt = document.getElementById("promptInput").value.trim();
  if (!prompt) {
    showToast("✏️ Please describe your video edit first.");
    return;
  }

  showLoading(true);
  hideResult();

  const systemPrompt = `You are CapCut Auto, an expert video editing assistant that creates precise, detailed, step-by-step editing guides specifically for CapCut.

When given a video edit description, generate a professional editing plan organized into clear sections using exact CapCut feature names.

Format your response using EXACTLY these section headers:

### 🎬 Overview
### 📁 Setup & Import
### ✂️ Clips & Timeline
### ✨ Effects & Transitions
### 📝 Text & Captions
### 🎵 Audio & Music
### 🎨 Color & Filters
### 📤 Export Settings
### 💡 Pro Tips

Use bullet points starting with - for each step. Be specific and actionable.`;

  const userMessage = `Create a detailed CapCut editing plan.
Style: ${currentStyle}
Description: ${prompt}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://aicapcuteditor-coder.github.io/capcut-auto",
        "X-Title": "CapCut Auto"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "API request failed");
    }

    const data = await response.json();
    const planText = data.choices?.[0]?.message?.content || "";
    currentPlanText = planText;
    renderPlan(planText);

  } catch (err) {
    console.error("Generation error:", err);
    showToast("❌ Error: " + (err.message || "Could not generate plan."));
    showLoading(false);
  }
}

// ---- Loading State ----
let loadingInterval;
function showLoading(show) {
  const loadingArea = document.getElementById("loadingArea");
  const generateBtn = document.getElementById("generateBtn");
  const generateBtnText = document.getElementById("generateBtnText");

  if (show) {
    loadingArea.classList.remove("hidden");
    generateBtn.disabled = true;
    generateBtnText.textContent = "Generating...";
    let i = 0;
    document.getElementById("loadingText").textContent = loadingMessages[0];
    loadingInterval = setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      document.getElementById("loadingText").textContent = loadingMessages[i];
    }, 1800);
  } else {
    loadingArea.classList.add("hidden");
    generateBtn.disabled = false;
    generateBtnText.textContent = "Generate Plan ✨";
    clearInterval(loadingInterval);
  }
}

function hideResult() {
  document.getElementById("resultArea").classList.add("hidden");
}

// ---- Render Plan ----
function renderPlan(text) {
  showLoading(false);
  const html = parsePlanToHTML(text);
  document.getElementById("resultContent").innerHTML = html;
  document.getElementById("resultArea").classList.remove("hidden");
  document.getElementById("resultArea").scrollIntoView({ behavior: "smooth", block: "start" });
}

function parsePlanToHTML(text) {
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += "</ul>"; inList = false; }
      continue;
    }
    if (trimmed.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3>${trimmed.replace("### ", "")}</h3>`;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      const content = trimmed.replace(/^(-\s|•\s)/, "");
      const id = `step-${Math.random().toString(36).slice(2, 8)}`;
      html += `<li id="${id}" onclick="toggleStep('${id}')">
        <div class="step-check"></div>
        <span>${escapeHtml(content)}</span>
      </li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p style="color:var(--text-muted);font-size:14px;margin-bottom:8px;">${escapeHtml(trimmed)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toggleStep(id) {
  const li = document.getElementById(id);
  if (li) li.classList.toggle("checked");
}

// ---- Copy / Save / Clear ----
function copyPlan() {
  if (!currentPlanText) return;
  navigator.clipboard.writeText(currentPlanText).then(() => {
    showToast("📋 Plan copied to clipboard!");
  });
}

async function savePlan() {
  if (!currentPlanText || !currentUser) return;
  const prompt = document.getElementById("promptInput").value.trim();
  const sb = getSupabase();

  try {
    const { error } = await sb.from("edit_plans").insert({
      user_id: currentUser.id,
      prompt,
      style: currentStyle,
      plan: currentPlanText,
      created_at: new Date().toISOString()
    });
    if (error) {
      saveToLocal({ prompt, style: currentStyle, plan: currentPlanText });
      showToast("💾 Saved locally!");
    } else {
      showToast("💾 Plan saved!");
      loadHistory();
    }
  } catch {
    saveToLocal({ prompt, style: currentStyle, plan: currentPlanText });
    showToast("💾 Saved locally!");
  }
}

function saveToLocal(planData) {
  const key = `capcut_plans_${currentUser?.id || "local"}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift({ ...planData, id: Date.now(), created_at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  savedPlans = existing;
}

function clearPlan() {
  document.getElementById("resultArea").classList.add("hidden");
  document.getElementById("promptInput").value = "";
  updateCharCount();
  currentPlanText = "";
}

// ---- History ----
async function loadHistory() {
  if (!currentUser) return;
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from("edit_plans")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      savedPlans = data;
    } else {
      const key = `capcut_plans_${currentUser.id}`;
      savedPlans = JSON.parse(localStorage.getItem(key) || "[]");
    }
  } catch {
    const key = `capcut_plans_${currentUser?.id || "local"}`;
    savedPlans = JSON.parse(localStorage.getItem(key) || "[]");
  }
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  if (!savedPlans || savedPlans.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No saved plans yet</h3>
        <p>Generate your first edit plan and save it here.</p>
        <button class="btn-primary" onclick="switchView('new')">Create Plan</button>
      </div>`;
    return;
  }
  list.innerHTML = savedPlans.map((plan, i) => {
    const date = new Date(plan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `
      <div class="history-item" onclick="openPlan(${i})">
        <div class="history-item-content">
          <div class="history-item-prompt">${escapeHtml(plan.prompt || "Untitled plan")}</div>
          <div class="history-item-meta">
            <span>📅 ${date}</span>
            <span>🎬 ${plan.style || "cinematic"}</span>
          </div>
        </div>
        <div class="history-item-badge">${plan.style || "cinematic"}</div>
        <div class="history-item-actions" onclick="event.stopPropagation()">
          <button class="btn-outline btn-sm" onclick="deletePlan(${i})">🗑</button>
        </div>
      </div>`;
  }).join("");
}

function openPlan(index) {
  const plan = savedPlans[index];
  if (!plan) return;
  const modal = document.getElementById("planModal");
  const content = document.getElementById("planModalContent");
  const date = new Date(plan.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  content.innerHTML = `
    <div class="plan-modal-header">
      <h2>📋 Edit Plan</h2>
      <p>${escapeHtml(plan.prompt || "Saved plan")} · ${date}</p>
    </div>
    <div class="result-content">${parsePlanToHTML(plan.plan || "")}</div>`;
  modal.classList.remove("hidden");
  modal.classList.add("visible");
}

async function deletePlan(index) {
  const plan = savedPlans[index];
  if (!plan || !confirm("Delete this plan?")) return;
  const sb = getSupabase();
  if (plan.id && typeof plan.id === "string") {
    await sb.from("edit_plans").delete().eq("id", plan.id);
  }
  savedPlans.splice(index, 1);
  const key = `capcut_plans_${currentUser?.id || "local"}`;
  localStorage.setItem(key, JSON.stringify(savedPlans));
  renderHistory();
  showToast("🗑 Plan deleted.");
}

function closePlanModal(e) {
  if (e.target.id === "planModal") closePlanModalDirect();
}

function closePlanModalDirect() {
  const modal = document.getElementById("planModal");
  modal.classList.remove("visible");
  setTimeout(() => modal.classList.add("hidden"), 200);
}

function useTemplate(prompt) {
  switchView("new");
  document.getElementById("promptInput").value = prompt;
  updateCharCount();
  document.getElementById("promptInput").focus();
  showToast("📋 Template loaded — press Generate!");
}
