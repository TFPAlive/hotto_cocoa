<script lang="ts" setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { checkUser } from "@/composables/useAuth";

const router = useRouter();
const identifier = ref(""); // email or username
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = "";

  try {
    const res = await axios.post("/api/auth/login", {
      identifier: identifier.value,
      password: password.value,
    }, { withCredentials: true });

    const { role } = res.data;

    await checkUser();

    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>


<template>
  <div class="login">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Email/Username:</label>
        <input v-model="identifier" type="text" placeholder="Email or Username" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Login</button>
    </form>

  <p v-if="loading" class="loading-text">Logging in...</p>
  <p v-if="error" class="error">{{ error }}</p>
    <div class="register-link-row">
      <span>Don't have an account?</span>
      <router-link to="auth/register" class="register-link">Register Here</router-link>
    </div>
  </div>
</template>

<style scoped>
.login {
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
input[type="text"],
input[type="password"] {
  width:370px;
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
.register-link-row {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 1rem;
}
.register-link {
  color: #a0522d;
  font-weight: bold;
  text-decoration: underline;
  transition: color 0.2s;
}
.register-link:hover {
  color: #e6b800;
}
.loading-text {
  color: #e6b800;
  margin-top: 12px;
  font-size: 1rem;
}
</style>
