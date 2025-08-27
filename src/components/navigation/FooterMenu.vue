<script setup lang="ts">
</script>

<template>
  <footer id="footer" class="footer">
    <div class="footer-section footer-logo">
      <img src="/hotto_choco.png" alt="Hotto Choco Logo" class="footer-logo-img" />
    </div>
    <div class="footer-section footer-contacts">
      <h4>Contact</h4>
      <ul>
        <li>Email: <a href="mailto:info@hottochoco.com">info@hottochoco.com</a></li>
        <li>Phone: <a href="tel:+1234567890">+1 234 567 890</a></li>
        <li>Address: 123 Choco Lane, Sweet City</li>
      </ul>
    </div>
    <div class="footer-section footer-links">
      <ul>
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">Accessibility Statement</a></li>
        <li><a href="#">Terms & Conditions</a></li>
        <li><a href="#">Refund Policy</a></li>
      </ul>
    </div>
  </footer>
</template>

<style scoped>
.footer,
.navbar {
  width: 100vw;
  background: var(--main-bg-color);
  color: var(--font-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 4vw 1.5rem 4vw;
  box-sizing: border-box;
  gap: 2vw;
  z-index: 999;
}
.footer-section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.footer-logo {
  flex-basis: 60%;
  max-width: 60%;
}
.footer-logo-img {
  width: 180px;
  height: auto;
  object-fit: contain;
}
.footer-contacts {
  flex-basis: 20%;
  max-width: 20%;
}
.footer-contacts h4 {
  margin-bottom: 0.5rem;
  color: var(--font-color);
}
.footer-contacts ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.98rem;
}
.footer-contacts li {
  margin-bottom: 0.3rem;
}
.footer-links {
  flex-basis: 20%;
  max-width: 20%;
}
.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-links li {
  margin-bottom: 0.3rem;
}
.footer-links a {
  color: var(--font-color);
  text-decoration: none;
  font-size: 0.98rem;
  transition: text-decoration 0.2s;
}
.footer-links a:hover {
  text-decoration: underline;
}
@media (max-width: 1024px) {
  .footer {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }
  .footer-logo,
  .footer-contacts,
  .footer-links {
    max-width: 100%;
    flex-basis: unset;
  }
  .footer-logo-img {
    width: 120px;
  }
}
</style>