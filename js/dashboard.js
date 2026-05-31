```js
// ================================
// dashboard.js
// ================================

// ---------- CONFIG ----------
const OPENROUTER_API_KEY =
  "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";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
  "openai/gpt-4o-mini";

// ---------- STATE ----------
let currentUser = null;

// ---------- DOM ----------
const promptInput =
  document.getElementById("promptInput");

const generateBtn =
  document.getElementById("generateBtn");

const userName =
  document.getElementById("userName");

const userEmail =
  document.getElementById("userEmail");

const historyContainer =
  document.getElementById("historyContainer");

// ---------- TOAST ----------
function showToast(message) {
  const toast = document.createElement("div");

  toast.innerText = message;

  toast.style.position = "fixed";
  toast.style.bottom = "30px";
  toast.style.right = "30px";
  toast.style.padding = "14px 20px";
  toast.style.background = "#1f1f1f";
  toast.style.color = "white";
  toast.style.borderRadius = "12px";
  toast.style.zIndex = "9999";
  toast.style.fontSize = "14px";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ---------- USER UI ----------
function initUserUI(user) {
  console.log("Initializing user UI");

  if (!user) {
    console.error("User missing");
    return;
  }

  if (userName) {
    userName.innerText =
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";
  }

  if (userEmail) {
    userEmail.innerText =
      user.email || "No email";
  }
}

// ---------- LOAD HISTORY ----------
async function loadHistory() {
  try {
    const saved =
      localStorage.getItem("capcutPlans");

    if (!saved) return;

    const plans = JSON.parse(saved);

    if (!historyContainer) return;

    historyContainer.innerHTML = "";

    plans.reverse().forEach((plan) => {
      const div =
        document.createElement("div");

      div.className = "history-item";

      div.innerHTML = `
        <h4>${plan.prompt}</h4>
        <p>${plan.response}</p>
      `;

      historyContainer.appendChild(div);
    });
  } catch (err) {
    console.error(
      "History load error:",
      err
    );
  }
}

// ---------- SAVE HISTORY ----------
function saveHistory(prompt, response) {
  const existing =
    JSON.parse(
      localStorage.getItem(
        "capcutPlans"
      ) || "[]"
    );

  existing.push({
    prompt,
    response,
    date: new Date().toISOString()
  });

  localStorage.setItem(
    "capcutPlans",
    JSON.stringify(existing)
  );
}

// ---------- GENERATE PLAN ----------
async function generatePlan() {
  try {
    const prompt =
      promptInput?.value?.trim();

    if (!prompt) {
      showToast(
        "❌ Please enter a prompt"
      );
      return;
    }

    generateBtn.disabled = true;
    generateBtn.innerText =
      "Generating...";

    console.log(
      "Sending request to OpenRouter"
    );

    const response = await fetch(
      OPENROUTER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            "https://aicapcuteditor-coder.github.io/capcut-auto",
          "X-Title":
            "CapCut Auto"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                `You are a CapCut editing assistant.
                
Create a detailed edit plan.

Include:
- Intro
- Effects
- Transitions
- Music ideas
- Text ideas
- Ending`
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "OpenRouter response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          "Unknown API error"
      );
    }

    const result =
      data.choices?.[0]?.message
        ?.content;

    if (!result) {
      throw new Error(
        "No response generated"
      );
    }

    saveHistory(prompt, result);

    showToast(
      "✅ Plan generated!"
    );

    console.log(result);

    alert(result);

    loadHistory();
  } catch (err) {
    console.error(
      "Generate error:",
      err
    );

    showToast(
      "❌ Error: " + err.message
    );
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerText =
      "Generate Plan ✨";
  }
}

// ---------- SUPABASE INIT ----------
window.addEventListener(
  "supabaseReady",
  async () => {
    try {
      console.log(
        "Supabase ready event fired"
      );

      const sb = getSupabase();

      console.log(
        "Supabase object:",
        sb
      );

      const {
        data: { session },
        error
      } =
        await sb.auth.getSession();

      console.log(
        "Session:",
        session
      );

      console.log(
        "Session error:",
        error
      );

      if (error) {
        throw error;
      }

      if (!session) {
        console.log(
          "No session found"
        );

        showToast(
          "❌ Login required"
        );

        window.location.href =
          "../index.html";

        return;
      }

      currentUser =
        session.user;

      console.log(
        "Current user:",
        currentUser
      );

      initUserUI(currentUser);

      loadHistory();
    } catch (err) {
      console.error(
        "Dashboard init error:",
        err
      );

      showToast(
        "❌ " + err.message
      );
    }
  }
);

// ---------- BUTTON ----------
if (generateBtn) {
  generateBtn.addEventListener(
    "click",
    generatePlan
  );
}

// ---------- SHORTCUT ----------
document.addEventListener(
  "keydown",
  (e) => {
    if (
      e.ctrlKey &&
      e.key === "Enter"
    ) {
      generatePlan();
    }
  }
);
```
