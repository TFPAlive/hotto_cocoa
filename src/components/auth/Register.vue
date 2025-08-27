<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);

async function handleRegister() {
  loading.value = true;
  error.value = "";
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  try {
    const res = await axios.post("/src/backend/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value,
    });
    console.log("Register success:", res.data);
    router.push("/");
  } catch (err: any) {
    error.value = err.response?.data?.message || "Register failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="register">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div>
        <label>Username:</label>
        <input v-model="username" type="text" required />
      </div>
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

    <p v-if="loading" class="loading-text">Registering...</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="login-link-row">
      <span>Already have an account?</span>
      <router-link to="/login" class="login-link">Login Now</router-link>
    </div>
  </div>
</template>

<style scoped>
.register {
  max-width: 400px;
  margin: 60px auto;
  padding: 32px 24px 24px 24px;
  background: #fffbe6;
  border-radius: 18px;
  box-shadow: 0 2px 12px #e0c3a033;
  display: flex;
  flex-direction: column;
  align-items: center;
}
h2 {
  color: #a0522d;
  margin-bottom: 18px;
}
form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
label {
  font-weight: 500;
  color: #5a3a1b;
}
input[type="email"],
input[type="password"],
input[type="text"] {
  width: 370px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1.5px solid #e6b800;
  font-size: 1rem;
  outline: none;
  background: #fffbe6;
  color: #5a3a1b;
  transition: border 0.2s;
}
input:focus {
  border-color: #a0522d;
}
button[type="submit"] {
  background: #ffe680;
  color: #a0522d;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 1px 4px #e0c3a044;
  transition: background 0.2s, color 0.2s;
}
button[type="submit"]:hover {
  background: #ffe080;
  color: #7a3a1b;
}
.error {
  color: red;
  margin-top: 12px;
  font-size: 1rem;
}
.login-link-row {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 1rem;
}
.login-link {
  color: #a0522d;
  font-weight: bold;
  text-decoration: underline;
  transition: color 0.2s;
}
.login-link:hover {
  color: #e6b800;
}
.loading-text {
  color: #e6b800;
  margin-top: 12px;
  font-size: 1rem;
}
</style>
