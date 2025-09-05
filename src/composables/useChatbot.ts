import { ref } from "vue";

export function useChatbot() {
  const messages = ref<{ sender: "user" | "bot"; text: string }[]>([]);
  const loading = ref(false);

  const sendMessage = async (prompt: string) => {
    // Push user message immediately
    messages.value.push({ sender: "user", text: prompt });
    loading.value = true;

    try {
      const res = await fetch("/api/lib/chatbot_conn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (data.reply) {
        messages.value.push({ sender: "bot", text: data.reply });
      } else if (data.error) {
        messages.value.push({ sender: "bot", text: "Oops! Something went wrong." });
      }
    } catch (err) {
      messages.value.push({ sender: "bot", text: "Network error, please try again." });
    } finally {
      loading.value = false;
    }
  };

  return { messages, loading, sendMessage };
}
