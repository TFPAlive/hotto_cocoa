<script setup lang="ts"></script>
<template>
    <div class="welcome-container">
        <div class="welcome-left">
            <div class="welcome-title">Self-design bar</div>
            <div class="cup-icons">
                <svg v-for="n in 5" :key="n" width="36" height="36" viewBox="0 0 24 24" fill="var(--hover-color)" xmlns="http://www.w3.org/2000/svg" class="cup-icon">
                    <rect x="7" y="8" width="10" height="10" rx="3" />
                    <rect x="9" y="4" width="6" height="4" rx="2" />
                    <rect x="10" y="18" width="4" height="2" rx="1" />
                </svg>
            </div>
        </div>
        <div class="welcome-right">
            <div class="welcome-desc"> Welcome to Hotto Choco, where we design our own chocolate cups to enjoy during your cozy holiday. Cocoa, coffee, matcha, anything. Whirl it up in your style! </div>
            <router-link to="/design" class="design-btn">Design Now</router-link>
        </div>
    </div>
</template>
<style scoped>
    .welcome-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 40px;
        padding: 40px 25px;
        margin: 0 auto;
        background-color: var(--main-bg-color);
    }

    .welcome-left {
        max-width: 500px;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .welcome-title {
        font-size: 4rem;
        font-weight: bold;
        margin-bottom: 24px;
        color: var(--header-color);
    }

    .cup-icons {
        display: flex;
        gap: 12px;
    }

    .cup-icon {
        filter: drop-shadow(0 2px 4px var(--shadow-color));
    }

    .welcome-right {
        max-width: 500px;
        flex: 2;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }

    .welcome-desc {
        font-size: 1.1rem;
        color: var(--font-color);
        line-height: 1.6;
    }

    .design-btn {
        display: inline-block;
        background: var(--button-color);
        color: var(--header-color);
        font-weight: bold;
        padding: 12px 32px;
        border-radius: 24px;
        text-decoration: none;
        font-size: 1.1rem;
        box-shadow: 0 2px 8px var(--shadow-color);
        transition: background 0.2s, color 0.2s;
    }

    .design-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    @media (max-width: 1024px) {
        .welcome-title {
            font-size: 2rem;
        }

        .welcome-container {
            flex-direction: column;
            gap: 24px;
            padding: 24px 0;
        }

        .welcome-left, .welcome-right {
            align-items: center;
            text-align: center;
        }

        .welcome-right {
            align-items: center;
        }
    }
</style>