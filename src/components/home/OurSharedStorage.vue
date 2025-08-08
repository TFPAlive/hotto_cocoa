<script setup lang="ts">
</script>

<template>
  <div class="oursharedstorage-container">
    <div class="oursharedstorage-text">
      <div class="oursharedstoragetext">
        <h1>Our shared storage</h1>
        <router-link to="/shop" class="design-btn">Shop Now</router-link>
        <table class="oursharedstorage-table">
          <tbody>
            <tr>
              <th>Ingredients</th>
              <td>
                Our cakes are the epitome of sweetness and elegance, perfect for weddings,
                birthdays, or any special occasion. Each cake is a masterpiece of flavor and design,
                sure to impress and delight.
              </td>
            </tr>
            <tr>
              <th>Tools &amp; equipment</th>
              <td>
                Indulge in our exquisite confections that are not only delicious but also
                beautifully crafted. From macarons to cupcakes, each sweet treat is a work of art
                that will satisfy your cravings and sweet tooth.
              </td>
            </tr>
            <tr>
              <th>Gift box</th>
              <td>
                Celebrate life's special moments with our sweet creations. Whether it's a baby
                shower, anniversary, or graduation, our treats are designed to add a touch of
                sweetness and joy to every occasion.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="oursharedstorage-video">
      <video class="story-video" src="/banner3.mp4" autoplay loop muted playsinline></video>
    </div>
  </div>
</template>

<style scoped>
.oursharedstorage-container {
  display: flex;
  width: 100%;
  min-height: 971px;
  box-sizing: border-box;
}
.oursharedstorage-video {
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
.oursharedstorage-text {
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
.oursharedstorage-table {
  width: 48%;
  float: right;
  margin-left: 32px;
  border-collapse: separate;
  border-spacing: 0 18px;
  margin-top: 0;
  margin-bottom: 0;
}
.oursharedstorage-table th {
  text-align: left;
  font-size: 1.2rem;
  color: var(--header-color);
  padding-bottom: 6px;
}
.oursharedstorage-table td {
  text-align: left;
  color: var(--font-color);
  font-size: 1.05rem;
  padding-bottom: 6px;
  vertical-align: top;
}
.oursharedstoragetext {
  display: inline-block;
  vertical-align: top;
}
.oursharedstoragetext h1 {
  font-size: 3rem;
  color: var(--header-color);
  margin-bottom: 25px;
}
.design-btn {
  display: inline-block;
  background: var(--main-bg-color);
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
  .oursharedstorage-container {
    flex-direction: column;
    min-height: 0;
    align-items: center;
  }
  .oursharedstorage-video {
    display: none;
  }
  .oursharedstorage-text {
    width: 100%;
    max-width: 100%;
    height: 100%;
    padding: 24px 12px;
    align-items: center;
    text-align: center;
  }
  .oursharedstorage-table {
    float: none;
    width: 100%;
    margin-left: 0;
    margin-top: 32px;
  }
  .oursharedstorage-table th,
  .oursharedstorage-table td {
    text-align: left !important;
  }
}
</style>