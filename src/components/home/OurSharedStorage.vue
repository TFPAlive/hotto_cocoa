<script setup lang="ts">
import '../../assets/oursharedstorage.css'
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
