<script setup lang="ts">
    import Navigation from './Navigation.vue';
    import axios from "axios";
    import { auth, checkUser } from "@/composables/useAuth";
    import { useRouter } from 'vue-router';
    const router = useRouter();

    async function handleLogout() {
        try {
            router.push("/auth/logging-out"); // Redirect to logging-out page first
            await axios.post("/api/auth?action=logout", {}, { withCredentials: true });
            await checkUser(); // update global state after logout
            router.push("/");
        } catch (err) {
            console.error("Logout failed", err);
        }
    }
</script>
<template>
    <header class="navbar">
        <div class="navbar-left">
            <router-link to="/" class="navbar-home-link">
                <img src="/icon.png" alt="Hotto Choco Icon" class="site-icon" />
                <span class="site-name">Hotto Choco</span>
            </router-link>
        </div>
        <Navigation />
        <div class="navbar-right">
            <div v-if="auth.isLoggedIn">
                <button class="login-btn" @click="handleLogout">Logout</button>
            </div>
        </div>
    </header>
</template>
<style scoped>
    .navbar-home-link:hover {
        text-emphasis: none;
        background-color: transparent;
    }

    .navbar {
        position: sticky;
        top: 0;
        left: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
        background: var(--main-bg-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .navbar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .navbar-home-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
    }

    .site-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }

    .site-name {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--font-color);
        letter-spacing: 1px;
    }

    .navbar-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .login-btn {
        background: var(--font-color);
        color: var(--main-bg-color);
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .login-btn:hover {
        background: var(--font-color);
    }

    .currency-dropdown {
        background: var(--main-bg-color);
        color: var(--font-color);
        border: 1.5px solid var(--font-color);
        padding: 0.45rem 1.5rem 0.45rem 0.75rem;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, border 0.2s;
        outline: none;
        appearance: none;
        min-width: 110px;
        font-weight: 500;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        margin-right: 0.5rem;
    }

    .currency-dropdown:focus {
        border-color: #e6b800;
        box-shadow: 0 0 0 2px #ffe68055;
    }

    .currency-dropdown option {
        color: #5a3a1b;
        background: #fffbe6;
    }

    /* Style for the Logout button */
    .logout-btn {
        background: var(--font-color);
        color: var(--main-bg-color);
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s, color 0.2s;
    }

    .logout-btn:hover {
        background: #e6b800;
        color: #fffbe6;
    }
</style>