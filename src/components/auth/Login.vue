<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

const email = ref("");
const password = ref("");
const error = ref("");

async function handleLogin() {
  try {
    const res = await axios.post("/api/auth/login", {
      email: email.value,
      password: password.value,
    });
    console.log("Login success:", res.data);
    // save JWT/token in localStorage
    localStorage.setItem("token", res.data.token);
  } catch (err: any) {
    error.value = err.response?.data?.message || "Login failed";
  }
}
</script>

<template>
  <div class="login">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Login</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.error {
  color: red;
}
</style>
