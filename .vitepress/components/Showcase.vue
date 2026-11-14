<script setup>
import { withBase } from 'vitepress'

// TODO: replace with your real live-demo URL (also update the "Live Demo"
// action in index.md). Until then this points at a placeholder.
const DEMO_URL = 'https://demo.example.com'

const items = [
  {
    badge: 'New in v6',
    title: 'Rates & multi-rate booking',
    text: 'Offer multiple rates or room types per entry with relative pricing and shared inventory — and let guests add several to a cart and book them together in one checkout.',
    img: '/img/resrv-availability-results-extras.webp',
    alt: 'Resrv availability results showing multiple rates and extras',
  },
  {
    title: 'Real-time availability search',
    text: 'Ready-to-use Livewire components let visitors search dates and instantly see live prices, availability and extras — with no frontend plumbing to build.',
    img: '/img/resrv-availability-search-with-prices.webp',
    alt: 'Resrv availability search showing live prices for selected dates',
  },
  {
    title: 'Dynamic pricing & coupons',
    text: 'Automatically apply discounts or surcharges based on length of stay, lead time, dates and more — and reward customers with coupon codes.',
    img: '/img/resrv-dynamic-pricing-applied.webp',
    alt: 'Resrv dynamic pricing rules applied to a reservation',
  },
  {
    title: 'Run it all from the control panel',
    text: 'Manage reservations, availability calendars, refunds and reports right inside Statamic — the dashboard your clients already know how to use.',
    img: '/img/resrv-reservations.webp',
    alt: 'Resrv reservations management inside the Statamic control panel',
  },
]
</script>

<template>
  <section class="resrv-show">
    <div class="resrv-show__inner">
      <header class="resrv-show__head">
        <p class="resrv-show__eyebrow">See it in action</p>
        <h2 class="resrv-show__title">A complete booking engine, ready to ship</h2>
      </header>

      <div class="resrv-show__rows">
        <article
          v-for="(item, i) in items"
          :key="item.title"
          class="resrv-show__row"
          :class="{ 'is-reversed': i % 2 === 1 }"
        >
          <div class="resrv-show__text">
            <span v-if="item.badge" class="resrv-show__badge">{{ item.badge }}</span>
            <h3 class="resrv-show__row-title">{{ item.title }}</h3>
            <p class="resrv-show__row-text">{{ item.text }}</p>
          </div>
          <figure class="resrv-show__media">
            <img :src="withBase(item.img)" :alt="item.alt" loading="lazy" />
          </figure>
        </article>
      </div>

      <div class="resrv-show__cta">
        <a class="resrv-show__btn" :href="DEMO_URL" target="_blank" rel="noopener noreferrer">
          Try the live demo
          <span class="resrv-show__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.resrv-show {
  padding: 72px 24px 0;
}

.resrv-show__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.resrv-show__head {
  max-width: 640px;
  margin: 0 auto 48px;
  text-align: center;
}

.resrv-show__eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.resrv-show__title {
  margin: 0;
  border: 0;
  padding: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.resrv-show__rows {
  display: flex;
  flex-direction: column;
  gap: 56px;
}

.resrv-show__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 40px;
}

.resrv-show__row.is-reversed .resrv-show__text {
  order: 2;
}

.resrv-show__badge {
  display: inline-block;
  margin-bottom: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.resrv-show__row-title {
  margin: 0;
  border: 0;
  padding: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.resrv-show__row-text {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.resrv-show__media {
  margin: 0;
}

.resrv-show__media img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: var(--vp-shadow-2);
}

.resrv-show__cta {
  margin-top: 56px;
  text-align: center;
}

.resrv-show__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  height: 48px;
  border-radius: 24px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 16px;
  font-weight: 600;
  line-height: 48px;
  text-decoration: none;
  transition: background-color 0.25s;
}

.resrv-show__btn:hover {
  background: var(--vp-c-brand-2);
}

.resrv-show__arrow {
  transition: transform 0.2s ease;
}

.resrv-show__btn:hover .resrv-show__arrow {
  transform: translateX(3px);
}

@media (min-width: 640px) {
  .resrv-show {
    padding-left: 48px;
    padding-right: 48px;
  }
}

@media (min-width: 960px) {
  .resrv-show {
    padding-left: 64px;
    padding-right: 64px;
  }
}

@media (max-width: 768px) {
  .resrv-show__title {
    font-size: 27px;
  }

  .resrv-show__row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  /* Always show the screenshot below its text on narrow screens. */
  .resrv-show__row.is-reversed .resrv-show__text {
    order: 0;
  }
}
</style>
