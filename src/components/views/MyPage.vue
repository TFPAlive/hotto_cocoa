<script setup lang="ts">
    import { ref, onMounted, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import Address from '../mypage/Address.vue';

    const route = useRoute();
    const router = useRouter();
    const activeSection = ref('orders')

    onMounted(() => {
        document.title = "My Page | Hotto Choco"
        // Check if there's a section in the URL query
        const section = route.query.section as string;
        if (section) {
            activeSection.value = section;
        }
    })

    function setActiveSection(section: string) {
        activeSection.value = section
        // Update the URL without page reload
        router.push({
            query: {
                section
            }
        });
    }
    // Watch for route changes (back/forward buttons)
    watch(() => route.query.section, (newSection) => {
        if (newSection && typeof newSection === 'string') {
            activeSection.value = newSection;
        }
    });
</script>
<template>
    <div class="mypage-container">
        <div class="sidebar">
            <div class="menu-section">
                <div class="menu-item" :class="{ active: activeSection === 'orders' }" @click="setActiveSection('orders')"> Your orders </div>
                <div class="menu-item" :class="{ active: activeSection === 'reviews' }" @click="setActiveSection('reviews')"> Your reviews </div>
                <div class="menu-item" :class="{ active: activeSection === 'profile' }" @click="setActiveSection('profile')"> Your profile </div>
                <div class="menu-item" :class="{ active: activeSection === 'favorite' }" @click="setActiveSection('favorite')"> Your favorite </div>
                <div class="menu-item" :class="{ active: activeSection === 'history' }" @click="setActiveSection('history')"> Browsing history </div>
                <div class="menu-item" :class="{ active: activeSection === 'addresses' }" @click="setActiveSection('addresses')"> Addresses </div>
                <div class="menu-item languages-currencies" :class="{ active: activeSection === 'languages' }" @click="setActiveSection('languages')"> Languages/Currencies </div>
            </div>
            <div class="menu-section">
                <div class="menu-item" :class="{ active: activeSection === 'payment' }" @click="setActiveSection('payment')"> Payment methods </div>
                <div class="menu-item" :class="{ active: activeSection === 'security' }" @click="setActiveSection('security')"> Account security </div>
            </div>
            <div class="menu-section">
                <div class="menu-item" :class="{ active: activeSection === 'permissions' }" @click="setActiveSection('permissions')"> Permissions </div>
            </div>
        </div>
        <div class="content-area">
            <div v-if="activeSection === 'orders'" class="content-section">
                <h2>Your Orders</h2>
                <p>Content for orders will go here...</p>
            </div>
            <div v-if="activeSection === 'reviews'" class="content-section">
                <h2>Your Reviews</h2>
                <p>Content for reviews will go here...</p>
            </div>
            <div v-if="activeSection === 'profile'" class="content-section">
                <h2>Your Profile</h2>
                <p>Content for profile will go here...</p>
            </div>
            <div v-if="activeSection === 'favorite'" class="content-section">
                <h2>Your Favorites</h2>
                <p>Content for favorites will go here...</p>
            </div>
            <div v-if="activeSection === 'history'" class="content-section">
                <h2>Browsing History</h2>
                <p>Content for browsing history will go here...</p>
            </div>
            <Address v-if="activeSection === 'addresses'" />
            <div v-if="activeSection === 'languages'" class="content-section">
                <h2>Languages/Currencies</h2>
                <p>Content for languages and currencies will go here...</p>
            </div>
            <div v-if="activeSection === 'payment'" class="content-section">
                <h2>Payment Methods</h2>
                <p>Content for payment methods will go here...</p>
            </div>
            <div v-if="activeSection === 'security'" class="content-section">
                <h2>Account Security</h2>
                <p>Content for account security will go here...</p>
            </div>
            <div v-if="activeSection === 'permissions'" class="content-section">
                <h2>Permissions</h2>
                <p>Content for permissions will go here...</p>
            </div>
        </div>
    </div>
</template>
<style scoped>
    .mypage-container {
        display: flex;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        gap: 0;
        min-height: 80vh;
    }

    .sidebar {
        width: 250px;
        flex-shrink: 0;
        position: relative;
        z-index: 1;
    }

    .menu-section {
        margin-bottom: 30px;
        border: 2px solid #a0522d;
        overflow: visible;
        position: relative;
    }

    .menu-item {
        padding: 12px 16px;
        cursor: pointer;
        color: #a0522d;
        font-weight: 500;
        border-bottom: 1px solid #a0522d;
        transition: all 0.2s ease;
        background: #fff;
        position: relative;
    }

    .menu-item:last-child {
        border-bottom: none;
    }

    .menu-item:hover:not(.active) {
        background: #f5f5f5;
        color: #7a3e20;
    }

    .menu-item.active {
        background: #fff;
        color: #a0522d;
        font-weight: 600;
        position: relative;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(160, 82, 45, 0.15);
        border-left: 4px solid #ff8800;
    }

    .menu-item.active::after {
        content: '';
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #fff;
        z-index: 11;
    }

    .languages-currencies {
        font-size: 0.9rem;
    }

    .content-area {
        flex: 1;
        background: #fff;
        border: 2px solid #a0522d;
        border-left: none;
        border-radius: 0 8px 8px 0;
        padding: 30px;
        min-height: 600px;
        position: relative;
        z-index: 1;
    }

    .content-area::before {
        content: '';
        position: absolute;
        left: -2px;
        top: -2px;
        bottom: -2px;
        width: 2px;
        background: linear-gradient(to bottom,
                #a0522d 0%,
                #a0522d 2px,
                transparent 2px,
                transparent 355px,
                #a0522d 355px,
                #a0522d 387px,
                transparent 389px,
                transparent 450px,
                #a0522d 450px,
                #a0522d 522px,
                transparent 522px,
                transparent 572px,
                #a0522d 572px,
                #a0522d 100%);
        z-index: 2;
    }

    .content-section h2 {
        color: #a0522d;
        margin-bottom: 20px;
        font-size: 1.8rem;
        border-bottom: 2px solid #a0522d;
        padding-bottom: 10px;
    }

    .content-section p {
        color: #666;
        line-height: 1.6;
        font-size: 1rem;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .mypage-container {
            flex-direction: column;
            padding: 10px;
            gap: 0;
        }

        .sidebar {
            width: 100%;
            margin-bottom: 0;
        }

        .menu-section {
            margin-bottom: 15px;
            border: 2px solid #a0522d;
            overflow: visible;
        }

        .menu-item.active::before {
            right: -2px;
            bottom: -20px;
            width: 100%;
            height: 20px;
            background: #fff;
            border-left: 2px solid #a0522d;
            border-bottom: 2px solid #a0522d;
            border-right: 2px solid #a0522d;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            border-top: none;
            border-top-right-radius: 0;
        }

        .menu-item.active::after {
            right: 0;
            bottom: -2px;
            width: 100%;
            height: 2px;
            background: #fff;
        }

        .content-area {
            border-left: 2px solid #a0522d;
            border-top: none;
            border-radius: 0 0 8px 8px;
            padding: 20px;
        }
    }
</style>