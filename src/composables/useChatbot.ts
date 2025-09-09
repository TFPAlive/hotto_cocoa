import { ref } from "vue";

export function useChatbot() {
  const reply = ref<string | null>(null);
  const loading = ref(false);

  const sendMessage = async (prompt: string) => {
    loading.value = true;

    try {
      const res = await fetch("/api/lib/chatbot_conn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.reply) {
        reply.value = data.reply;
      } else if (data.error) {
        reply.value = "Oops! Something went wrong.";
      }
    } catch (err) {
      reply.value = "Network error, please try again.";
    } finally {
      loading.value = false;
    }
  };

  return { reply, loading, sendMessage };
}
