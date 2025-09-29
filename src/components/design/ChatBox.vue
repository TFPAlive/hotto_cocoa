<script setup lang="ts">
    import { ref } from "vue";
    import { useChatbot } from "@/composables/useChatbot";

    const prompt = ref("");
    const { reply, loading, sendMessage } = useChatbot();
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
    const handleEnter = (e: KeyboardEvent) => {
        if (e.shiftKey) {
            // Allow new line
            return;
        }
        e.preventDefault();
        send();
    };
</script>
<template>
    <div class="chatbot-background">
        <div class="chatbot-container">
            <h2 class="chatbot-header">Welcome to your self-serve corner</h2>
            <div class="chatbox" ref="chatboxRef">
                <transition name="chat" mode="out-in">
                    <div key="greeting" v-if="!reply" class="chatbot-respond">
                        {{ greeting }}
                    </div>
                    <div key="reply" v-else class="chatbot-respond">
                        <strong>Bot:</strong> {{ reply }}
                    </div>
                </transition>
            </div>
            <div class="chatbot-input-row">
                <textarea v-model="prompt" class="chatbot-input" rows="2" placeholder="Type your message..." @keydown.enter.prevent="handleEnter"></textarea>
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
        min-height: 200px;
        background: var(--main-bg-color);
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
        width: inherit;
    }

    /* Animation for messages (fade + slide up) */
    .chat-enter-active, .chat-leave-active {
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