<script setup lang="ts">
import { ref } from "vue";
import { useChatbot } from "@/composables/useChatbot";

const prompt = ref("");
const { messages, loading, sendMessage } = useChatbot();

// Greeting shown only once, before any messages
const greeting = `Hi! I'm the Hotto Choco box chat.
Let's do our best for your perfect drink. 
Tell me what you want, or click on the stuff below.`;

const send = () => {
  if (prompt.value.trim()) {
    sendMessage(prompt.value);
    prompt.value = "";
  }
};
</script>

<template>
  <div class="chatbot-background">
    <div class="chatbot-container">
      <h2 class="chatbot-header">Welcome to your self-serve corner</h2>

      <div class="chatbox">
        <!-- Show greeting only if no messages yet -->
        <div v-if="messages.length === 0" class="chatbot-respond">
          {{ greeting }}
        </div>

        <!-- Loop through messages -->
        <transition-group name="chat" tag="div" class="chat-messages">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="chat-message"
            :class="m.sender"
          >
            <strong v-if="m.sender === 'bot'">Bot:</strong>
            <strong v-else>You:</strong>
            {{ m.text }}
          </div>
        </transition-group>
      </div>

      <div class="chatbot-input-row">
        <textarea
          v-model="prompt"
          class="chatbot-input"
          rows="2"
          placeholder="Type your message..."
        ></textarea>
        <button class="chatbot-send-btn" @click="send" :disabled="loading">
          {{ loading ? "Thinking..." : "Send" }}
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.chatbot-background {
  padding: 20px;
  background-color: var(--main-bg-color);
}
.chatbot-container {
  max-width: 1000px;
  margin: 0 auto;
  background: var(--main-bg-color);
  border-radius: 18px;
  box-shadow: 0 2px 12px #e0c3a033;
  padding: 32px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chatbot-header {
  font-size: 1.7rem;
  color: #a0522d;
  margin-bottom: 18px;
  text-align: center;
}
.chatbot-respond {
  font-size: 1.1rem;
  color: #5a3a1b;
  margin-bottom: 24px;
}
.chatbox {
  width: 100%;
  min-height: 180px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 6px #e0c3a044;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-height: 200px;
  overflow-y: scroll;
}
.chatbot-input-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}
.chatbot-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1.5px solid #e6b800;
  font-size: 1rem;
  outline: none;
  background: var(--main-bg-color);
  color: #5a3a1b;
  transition: border 0.2s;
  margin: 20px 20px 10px 0;
}
.chatbot-input:focus {
  border-color: #a0522d;
}
.chatbot-send-btn {
  background: #ffe680;
  color: #a0522d;
  border: none;
  border-radius: 8px;
  padding: 0 22px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 1px 4px #e0c3a044;
  transition: background 0.2s, color 0.2s;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chatbot-send-btn:hover {
  background: #ffe080;
  color: #7a3a1b;
}
.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Shared chat bubble look */
.chat-message {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 70%;
  word-wrap: break-word;
  width: inherit;
}

/* User vs bot style */
.chat-message.user {
  align-self: flex-end;
  /* background-color: #c9f2ff; */
}
.chat-message.bot {
  align-self: flex-start;
  /* background-color: #f0e5ff; */
}

/* Animation for messages (fade + slide up) */
.chat-enter-active,
.chat-leave-active {
  transition: all 0.3s ease;
}
.chat-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.chat-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.chat-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.chat-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

</style>