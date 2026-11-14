<script setup>
// "Who it's for" cards. Edit the list here.
const audiences = [
  { icon: '🏨', title: 'Hotels & rooms', text: 'Nightly availability, multiple room types and per-day pricing.' },
  { icon: '🍽️', title: 'Restaurants', text: 'Table reservations with time slots and party sizes.' },
  { icon: '🚗', title: 'Car rentals', text: 'Date-range bookings with extras like insurance or GPS.' },
  { icon: '⛵', title: 'Boats & charters', text: 'Hourly or daily charters, each with its own availability.' },
  { icon: '🎟️', title: 'Tours & activities', text: 'Sell spots on tours, classes and experiences.' },
  { icon: '📅', title: 'Appointments', text: 'Any service or appointment-based business.' },
]
</script>

<template>
  <section class="resrv-aud">
    <div class="resrv-aud__inner">
      <header class="resrv-aud__head">
        <p class="resrv-aud__eyebrow">One engine, many use cases</p>
        <h2 class="resrv-aud__title">Built for any booking business</h2>
        <p class="resrv-aud__sub">
          Every Statamic entry becomes a bookable product, so Resrv adapts to whatever your clients reserve.
        </p>
      </header>
      <ul class="resrv-aud__grid">
        <li v-for="a in audiences" :key="a.title" class="resrv-aud__card">
          <span class="resrv-aud__icon" aria-hidden="true">{{ a.icon }}</span>
          <h3 class="resrv-aud__card-title">{{ a.title }}</h3>
          <p class="resrv-aud__card-text">{{ a.text }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.resrv-aud {
  padding: 64px 24px 0;
}

.resrv-aud__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.resrv-aud__head {
  max-width: 640px;
  margin: 0 auto 40px;
  text-align: center;
}

.resrv-aud__eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.resrv-aud__title {
  margin: 0;
  border: 0;
  padding: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.resrv-aud__sub {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.resrv-aud__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.resrv-aud__card {
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s, transform 0.25s;
}

.resrv-aud__card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.resrv-aud__icon {
  font-size: 28px;
  line-height: 1;
}

.resrv-aud__card-title {
  margin: 14px 0 0;
  border: 0;
  padding: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
}

.resrv-aud__card-text {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
  .resrv-aud {
    padding-left: 48px;
    padding-right: 48px;
  }
}

@media (min-width: 960px) {
  .resrv-aud {
    padding-left: 64px;
    padding-right: 64px;
  }
}

@media (max-width: 768px) {
  .resrv-aud__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .resrv-aud__title {
    font-size: 27px;
  }
}

@media (max-width: 480px) {
  .resrv-aud__grid {
    grid-template-columns: 1fr;
  }
}
</style>
