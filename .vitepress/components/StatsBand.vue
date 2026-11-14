<script setup>
// Track-record stats. Edit the values/labels here.
const stats = [
  { value: '3+ years', label: 'running in production' },
  { value: 'Thousands', label: 'of bookings processed' },
  { value: 'Millions', label: 'in revenue generated' },
  { value: 'Hundreds', label: 'of automated tests' },
]
</script>

<template>
  <section class="resrv-stats">
    <div class="resrv-stats__inner">
      <p class="resrv-stats__eyebrow">Proven in production</p>
      <ul class="resrv-stats__grid">
        <li v-for="s in stats" :key="s.value" class="resrv-stats__item">
          <span class="resrv-stats__value">{{ s.value }}</span>
          <span class="resrv-stats__label">{{ s.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.resrv-stats {
  /* Top gap comes from the hero's padding-bottom; mirror it below so the
     band sits evenly between the hero and the feature grid. */
  padding: 0 24px 48px;
}

.resrv-stats__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.resrv-stats__eyebrow {
  margin: 0 0 24px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.resrv-stats__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.resrv-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.resrv-stats__value {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.1;
  background: linear-gradient(120deg, #f56b3c, #f8ad22);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.resrv-stats__label {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
  .resrv-stats {
    padding-bottom: 64px;
    padding-left: 48px;
    padding-right: 48px;
  }
}

@media (min-width: 960px) {
  .resrv-stats {
    padding-left: 64px;
    padding-right: 64px;
  }
}

@media (max-width: 640px) {
  .resrv-stats__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .resrv-stats__value {
    font-size: 27px;
  }
}
</style>
