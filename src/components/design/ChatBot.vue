<script lang="js">
</script>

<template>
  <div class="chatbot-background">
    <div class="chatbot-container">
      <h2 class="chatbot-header">Welcome to your self-serve corner</h2>
      <div class="chatbot-intro">
        Hi! I'm the Hotto Choco box chat.<br />
        Let's do our best for your perfect drink. Tell me what you want, or click on the stuff below.
      </div>
      <div class="chatbox">
      </div>
      <div class="chatbot-input-row">
        <textarea class="chatbot-input" rows="2" placeholder="Type your message..."></textarea>
        <button class="chatbot-send-btn">Send</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbot-background {
  padding: 20px;
  background-color: var(--button-color);
}
.chatbot-container {
  max-width: 750px;
  margin: 0 auto;
  background: #fffbe6;
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
.chatbot-intro {
  font-size: 1.1rem;
  color: #5a3a1b;
  margin-bottom: 24px;
  text-align: center;
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
  background: #fffbe6;
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
</style>