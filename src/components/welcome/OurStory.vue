<script setup lang="ts">
import '../../assets/ourstory.css'
</script>

<template>
  <div class="ourstory-container">
    <div class="ourstory-video">
      <video class="story-video" src="/banner2.mp4" autoplay loop muted playsinline></video>
    </div>
    <div class="ourstory-text">
      <div class="text">
        <h1>Our Story</h1>
        <h2>About us</h2>
        <p>
          At The Sweet Retreat, we specialize in creating decadent cakes and confections that are
          not only delicious but also visually stunning. Our unique flavors and artistic designs
          make every dessert a work of art, setting us apart in the world of sweet treats.
        </p>
        <h2>Our Mission</h2>
        <p>
          Our mission is to bring joy to our customers through our sweet creations. We aim to
          provide a memorable experience with every bite, ensuring that our treats are not only
          tasty but also visually appealing.
        </p>
      </div>
      <router-link to="/design" class="design-btn">Design Now</router-link>
    </div>
  </div>
</template>
