<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  try {
    const res = await axios.post("/api/auth/register", {
      email: email.value,
      password: password.value,
    });
    console.log("Register success:", res.data);
  } catch (err: any) {
    error.value = err.response?.data?.message || "Register failed";
  }
}
</script>

<template>
  <div class="register">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <div>
        <label>Confirm Password:</label>
        <input v-model="confirmPassword" type="password" required />
      </div>
      <button type="submit">Register</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.error {
  color: red;
}
</style>
