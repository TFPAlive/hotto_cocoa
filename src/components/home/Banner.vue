<script setup lang="ts">
    import IconCampaign from '../icons/IconCampaign.vue'
    import { ref } from 'vue'
	
    const repeatCount = ref(7)
</script>
<template>
    <div class="banner">
        <div class="banner-track">
            <template v-for="n in repeatCount" :key="'a' + n">
                <div class="banner-track-inner">
                    <span class="banner-text">Summer Campaign</span>
                    <span class="banner-icon" aria-label="sun">
                        <IconCampaign />
                    </span>
                </div>
            </template>
        </div>
        <div aria-hidden class="banner-track">
            <template v-for="n in repeatCount" :key="'a' + n">
                <div class="banner-track-inner">
                    <span class="banner-text">Summer Campaign</span>
                    <span class="banner-icon" aria-label="sun">
                        <IconCampaign />
                    </span>
                </div>
            </template>
        </div>
    </div>
</template>
<style scoped>
    .banner {
        width: 100vw;
        height: 50px;
        overflow: auto;
        background: var(--main-bg-color);
        display: flex;
        align-items: center;
        position: relative;
        border-top: 1px solid var(--font-color);
        border-bottom: 1px solid var(--font-color);
    }

    .banner::-webkit-scrollbar {
        display: none;
    }

    /* Two tracks for seamless looping */
    .banner-track {
        width: auto;
        height: 50px;
        display: flex;
        animation: scroll 10s linear infinite;
    }

    .banner-track-inner {
        display: flex;
        align-items: center;
        white-space: nowrap;
        height: 100%;
    }

    .banner-text {
        display: inline-block;
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--font-color);
        margin-right: 0;
        letter-spacing: 1px;
        padding: 0 30px 0 20px;
    }

    .banner-icon {
        display: inline-flex;
        align-items: center;
        margin-right: 20px;
    }

    @keyframes scroll {
        from { 
            translate: 0;
        }

        to { 
            translate: -100%; 
        }
    }
</style>