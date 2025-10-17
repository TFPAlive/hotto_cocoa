<script setup lang="ts">
    import Navigation from './Navigation.vue';
    import CartMenu from './CartMenu.vue';
    import axios from "axios";
    import { auth, checkUser } from "@/composables/useAuth";
    import { useRouter } from 'vue-router';
    import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

    const router = useRouter();
    const showDropdown = ref(false);
    const dropdownRoot = ref<HTMLElement | null>(null);
    const userName = computed(() => auth.user?.username || 'User');
    const userAvatar = computed(() => auth.user?.imageurl || '/default-avatar.png');
	
    async function handleLogout() {
        try {
            router.push("/auth/logging-out"); // Redirect to logging-out page first
            await axios.post("/api/auth?action=logout", {}, {
                withCredentials: true
            })
            await checkUser(); // update global state after logout
            router.push("/");
            showDropdown.value = !showDropdown.value
        } catch (err) {
            console.error("Logout failed", err);
        }

        function onDocumentClick(e: MouseEvent) {
            const root = dropdownRoot.value
            if (!root) return
            const target = e.target as Node | null
            if (target && root.contains(target)) return // clicked inside -> ignore
            showDropdown.value = false
        }

        onMounted(() => {
            document.addEventListener('click', onDocumentClick)
        })

        onBeforeUnmount(() => {
            document.removeEventListener('click', onDocumentClick)
        })
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
            <CartMenu />
            <div v-if="auth.isLoggedIn" class="user-dropdown-wrapper">
                <div class="user-dropdown" ref="dropdownRoot">
                    <div class="user-trigger" @click="showDropdown = !showDropdown">
                        <img :src="userAvatar" class="user-avatar" alt="User Avatar" />
                        <span class="user-name">{{ userName }}</span>
                        <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 16 16">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </div>
                    <div v-if="showDropdown" class="dropdown-menu">
                        <div class="dropdown-header">
                            <img :src="userAvatar" class="dropdown-avatar" alt="User Avatar" />
                            <div class="dropdown-username">{{ userName }}</div>
                        </div>
                        <hr />
                        <router-link to="/mypage?section=profile" class="dropdown-item" @click="showDropdown = !showDropdown">My Profile</router-link>
                        <router-link to="/mypage?section=addresses" class="dropdown-item" @click="showDropdown = !showDropdown">My Address</router-link>
                        <router-link to="/mypage?section=orders" class="dropdown-item" @click="showDropdown = !showDropdown">My Orders</router-link>
                        <router-link to="/mypage?section=favorite" class="dropdown-item" @click="showDropdown = !showDropdown">My Favorite</router-link>
                        <hr />
                        <button class="dropdown-logout" @click="handleLogout">Sign Out</button>
                    </div>
                </div>
            </div>
            <div v-else>
                <router-link to="/auth/login"><button class="login-btn">Login</button></router-link>
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
        z-index: 2;
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

    /* User Dropdown Styles */
    .user-dropdown-wrapper {
        position: relative;
    }

    .user-dropdown {
        position: relative;
        display: flex;
        align-items: center;
    }

    .user-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        transition: background 0.15s;
    }

    .user-trigger:hover {
        background: #f5f5f5;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid #ccc;
    }

    .user-name {
        font-weight: 500;
        color: var(--font-color);
    }

    .dropdown-arrow {
        margin-left: 2px;
        color: #888;
    }

    .dropdown-menu {
        position: absolute;
        top: 110%;
        right: 0;
        min-width: 220px;
        background: #222;
        color: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 24px #0002;
        padding: 0.5rem 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.18s;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .dropdown-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem 0.5rem 0.5rem 0.5rem;
    }

    .dropdown-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
        margin-bottom: 0.5rem;
    }

    .dropdown-username {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.2rem;
    }

    .dropdown-item {
        color: #fff;
        text-decoration: none;
        padding: 0.7rem 1.5rem;
        font-size: 1rem;
        transition: background 0.13s;
        border: none;
        background: none;
        text-align: left;
    }

    .dropdown-item:hover {
        background: #333;
    }

    .dropdown-logout {
        color: #fff;
        background: #a0522d;
        border: none;
        border-radius: 6px;
        padding: 0.7rem 1.5rem;
        font-size: 1rem;
        margin: 0.5rem 1rem 0.5rem 1rem;
        cursor: pointer;
        transition: background 0.15s;
    }

    .dropdown-logout:hover {
        background: #7a3a1d;
    }
</style>