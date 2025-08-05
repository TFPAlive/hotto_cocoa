<script setup lang="ts">
import '../../assets/banner.css'
import IconCampaign from '../icons/IconCampaign.vue'
import { ref } from 'vue'
const repeatCount = ref(7)
</script>

<template>
  <div class="banner">
    <div class="banner-track banner-track-1">
      <div class="banner-track-inner">
        <template v-for="n in repeatCount" :key="'a' + n">
          <span class="banner-text">Summer Campaign</span>
          <span class="banner-icon" aria-label="sun">
            <IconCampaign />
          </span>
        </template>
      </div>
    </div>
    <div class="banner-track banner-track-2">
      <div class="banner-track-inner">
        <template v-for="n in repeatCount" :key="'b' + n">
          <span class="banner-text">Summer Campaign</span>
          <span class="banner-icon" aria-label="sun">
            <IconCampaign />
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
