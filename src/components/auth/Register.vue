<script lang="ts" setup>
    import { ref } from "vue";
    import axios from "axios";
    import { useRouter } from "vue-router";
    import { checkUser } from "@/composables/useAuth";

    const router = useRouter();
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const error = ref("");
    const loading = ref(false);
	const showPassword = ref(false);
	const showConfirmPassword = ref(false);

    async function handleRegister() {
        loading.value = true;
        error.value = "";
        if (password.value !== confirmPassword.value) {
            error.value = "Passwords do not match";
            loading.value = false;
            return;
        }
        try {
            const res = await axios.post("/api/auth?action=register", { username: username.value, email: email.value, password: password.value }, { withCredentials: true });
            const { role } = res.data;
            await checkUser();
            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/");
            }
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
            <div style="position: relative;">
                <label>Password:</label>
                <input v-model="password" :type="showPassword ? 'text' : 'password'" />
                <button type="button" @click="showPassword = !showPassword" class="password-toggle" tabindex="-1" aria-label="Toggle password visibility">
                    <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0522d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.61 3.16-4.77 5.66-6.11" />
                        <path d="M1 1l22 22" />
                        <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03" />
                        <path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.62 0-1.21.18-1.7.49" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0522d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3.5" />
                    </svg>
                </button>
            </div>
            <div style="position: relative;">
                <label>Password:</label>
                <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" />
                <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="password-toggle" tabindex="-1" aria-label="Toggle password visibility">
                    <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0522d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.61 3.16-4.77 5.66-6.11" />
                        <path d="M1 1l22 22" />
                        <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.38 0 2.63-.83 3.16-2.03" />
                        <path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.62 0-1.21.18-1.7.49" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a0522d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3.5" />
                    </svg>
                </button>
            </div>
            <button type="submit">Register</button>
        </form>
        <p v-if="loading" class="loading-text">Registering...</p>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="login-link-row">
            <span>Already have an account?</span>
            <router-link to="login" class="login-link">Login Now</router-link>
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

    .password-toggle {
        position: absolute;
        right: 8px;
        top: 75%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #a0522d;
    }
</style>