<script setup lang="ts">
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

<style scoped>
.ourstory-container {
  display: flex;
  width: 100%;
  min-height: 971px;
  box-sizing: border-box;
}
.ourstory-video {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  overflow: hidden;
  height: 100%;
}
.story-video {
  top: 0;
  left: 0;
  width: 50vw;
  height: 100vh;
  object-fit: cover;
  display: block;
  pointer-events: none;
  background-size: cover;
  background-position: center;
}
.ourstory-text {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 32px;
  background: var(--main-bg-color);
  color: var(--font-color);
  font-size: 1.1rem;
  box-sizing: border-box;
  max-width: 50%;
}
.text {
  max-width: 500px;
}
.text h1 {
  font-size: 3rem;
  color: var(--header-color);
  margin-bottom: 25px;
}
.text h2 {
  font-size: 2rem;
  color: var(--font-color);
  margin-bottom: 18px;
}
.design-btn {
  display: inline-block;
  background: var(--hover-color);
  color: var(--header-color);
  font-weight: bold;
  padding: 12px 32px;
  border-radius: 24px;
  text-decoration: none;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px #e0c3a0;
  margin-top: 25px;
  transition:
    background 0.2s,
    color 0.2s;
}
.design-btn:hover {
  background: var(--hover-color);
  color: var(--hover-font-color);
}
@media (max-width: 1024px) {
  .ourstory-container {
    flex-direction: column;
    min-height: 0;
    align-items: center;
  }
  .ourstory-video {
    display: none;
  }
  .ourstory-text {
    width: 100%;
    max-width: 100%;
    height: 100%;
    padding: 24px 12px;
    align-items: center;
    text-align: center;
  }
}
</style>