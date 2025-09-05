// composables/useChatbot.ts
import { ref } from "vue";
import axios from "axios";

export function useChatbot() {
  const loading = ref(false);
  const reply = ref("");

  const sendMessage = async (prompt: string) => {
    loading.value = true;
    reply.value = "";
    try {
      const { data } = await axios.post("/api/chatbot_conn", { prompt });
      reply.value = data.reply || "";
    } catch (err: any) {
      reply.value = "Error: " + err.message;
    } finally {
      loading.value = false;
    }
  };

  return { reply, loading, sendMessage };
}
