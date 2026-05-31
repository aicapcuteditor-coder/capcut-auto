```js
async function generatePlan() {
  const prompt =
    document.getElementById("promptInput")
    .value
    .trim();

  if (!prompt) {
    showToast("Enter a prompt");
    return;
  }

  try {
    showToast("Generating...");

    console.log("Using key:",
      OPENROUTER_API_KEY.slice(0, 15)
    );

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model:
            "mistralai/mistral-7b-instruct:free",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful CapCut editor."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    console.log(
      "HTTP Status:",
      response.status
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
        "API failed"
      );
    }

    const result =
      data.choices?.[0]?.message
      ?.content;

    alert(result);

  } catch (err) {
    console.error(err);

    showToast(
      "❌ " + err.message
    );
  }
}
```
