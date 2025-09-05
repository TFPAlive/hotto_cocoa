<template>
  <div class="p-4 max-w-lg mx-auto space-y-4">
    <h2 class="text-xl font-bold">Chatbot</h2>

    <textarea
      v-model="prompt"
      class="w-full border rounded p-2"
      placeholder="Type your question..."
    />

    <button
      @click="send"
      :disabled="loading"
      class="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {{ loading ? "Thinking..." : "Send" }}
    </button>

    <div v-if="reply" class="mt-4 p-3 border rounded bg-gray-50">
      <strong>Bot:</strong> {{ reply }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useChatbot } from "@/composables/useChatbot";

const prompt = ref("");
const { reply, loading, sendMessage } = useChatbot();

const send = () => {
  if (prompt.value.trim()) {
    sendMessage(prompt.value);
    prompt.value = "";
  }
};
</script>
