<script setup>
import { withBase } from 'vitepress'

const MARKETPLACE_URL = 'https://statamic.com/addons/reach/resrv'
</script>

<template>
  <section class="resrv-cta">
    <div class="resrv-cta__inner">
      <h2 class="resrv-cta__title">Add a powerful booking system to any Statamic site</h2>
      <p class="resrv-cta__sub">
        Self-hosted and fully yours — no platform fees, no per-booking cuts, no vendor lock-in.
      </p>
      <div class="resrv-cta__actions">
        <a class="resrv-cta__btn resrv-cta__btn--solid" :href="withBase('/installation')">
          Get Started
        </a>
        <a
          class="resrv-cta__btn resrv-cta__btn--ghost"
          :href="MARKETPLACE_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy on the Marketplace
        </a>
      </div>
      <p class="resrv-cta__note">
        Free during development · One-time license · In production for 3+ years
      </p>
    </div>
  </section>
</template>

<style scoped>
.resrv-cta {
  margin-top: 80px;
  padding: 24px;
}

.resrv-cta__inner {
  max-width: 1152px;
  margin: 0 auto;
  padding: 64px 32px;
  border-radius: 20px;
  background: linear-gradient(100deg, #f56b3c 0%, #f8742f 45%, #f8ad22 100%);
  color: #fff;
  text-align: center;
}

.resrv-cta__title {
  max-width: 640px;
  margin: 0 auto;
  border: 0;
  padding: 0;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #fff;
}

.resrv-cta__sub {
  max-width: 560px;
  margin: 16px auto 0;
  font-size: 17px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.92);
}

.resrv-cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.resrv-cta__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 24px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.25s, border-color 0.25s, color 0.25s, transform 0.25s;
}

.resrv-cta__btn--solid {
  background: #fff;
  color: #e9430c;
}

.resrv-cta__btn--solid:hover {
  transform: translateY(-2px);
  background: #fff;
}

.resrv-cta__btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #fff;
}

.resrv-cta__btn--ghost:hover {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.resrv-cta__note {
  margin: 24px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

@media (max-width: 768px) {
  .resrv-cta__inner {
    padding: 48px 24px;
  }

  .resrv-cta__title {
    font-size: 26px;
  }

  .resrv-cta__btn {
    width: 100%;
    max-width: 320px;
  }
}
</style>
