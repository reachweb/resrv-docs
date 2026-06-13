<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { withBase } from 'vitepress'

// Bump this key to re-show the banner to everyone after a future change.
const STORAGE_KEY = 'resrv-banner-v6-dismissed'

const bannerEl = ref(null)
const open = ref(false) // drives the slide-in / slide-out
const hidden = ref(false) // fully removed from the DOM once dismissed
let resizeObserver = null

const upgradeLink = withBase('/upgrading')

function setTopHeight(px) {
  document.documentElement.style.setProperty('--vp-layout-top-height', `${px}px`)
}

// Keep the reserved layout offset in sync with the banner's real height
// (handles wrapping on small screens and late font loads).
function syncHeight() {
  if (open.value && bannerEl.value) {
    setTopHeight(bannerEl.value.offsetHeight)
  }
}

function dismiss() {
  open.value = false
  setTopHeight(0)
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch (e) {
    // ignore (private mode / disabled storage)
  }
  // Remove from the DOM after the slide-up transition completes.
  window.setTimeout(() => {
    hidden.value = true
  }, 400)
}

onMounted(async () => {
  let dismissed = false
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1'
  } catch (e) {
    // ignore
  }

  if (dismissed) {
    hidden.value = true
    return
  }

  await nextTick()
  if (!bannerEl.value) return

  // Open on the next frame so the transition animates from the closed state.
  requestAnimationFrame(() => {
    if (!bannerEl.value) return
    open.value = true
    setTopHeight(bannerEl.value.offsetHeight)
  })

  resizeObserver = new ResizeObserver(syncHeight)
  resizeObserver.observe(bannerEl.value)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  setTopHeight(0)
})
</script>

<template>
  <div
    v-if="!hidden"
    ref="bannerEl"
    class="resrv-banner"
    :class="{ open }"
    role="region"
    aria-label="Announcement"
  >
    <a class="resrv-banner__msg" :href="upgradeLink">
      <span class="resrv-banner__tag">New</span>
      <span class="resrv-banner__text">
        <strong>Resrv v6</strong> is now available for Statamic&nbsp;6, with Rates support.
        <span class="resrv-banner__cta"
          >Read the upgrade guide<span class="resrv-banner__arrow" aria-hidden="true">→</span></span
        >
      </span>
    </a>
    <button
      class="resrv-banner__close"
      type="button"
      aria-label="Dismiss announcement"
      @click="dismiss"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M5 5l14 14M19 5L5 19" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.resrv-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--vp-z-index-layout-top);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40px;
  padding: 8px 44px;
  background: linear-gradient(100deg, #f56b3c 0%, #f8742f 45%, #f8ad22 100%);
  color: #fff;
  text-align: center;
  /* Drawer slide. visibility flips only after the slide finishes so the
     hidden banner stays out of the tab order / a11y tree. */
  transform: translateY(-100%);
  visibility: hidden;
  transition: transform 0.35s ease, visibility 0s linear 0.35s;
}

.resrv-banner.open {
  transform: translateY(0);
  visibility: visible;
  transition: transform 0.35s ease, visibility 0s linear 0s;
}

.resrv-banner__msg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  text-decoration: none;
}

.resrv-banner__msg:hover {
  color: #fff;
}

.resrv-banner__tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.resrv-banner__cta {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
}

.resrv-banner__arrow {
  display: inline-block;
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.resrv-banner__msg:hover .resrv-banner__arrow {
  transform: translateX(3px);
}

.resrv-banner__close {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #fff;
  opacity: 0.85;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.resrv-banner__close:hover {
  background: rgba(255, 255, 255, 0.2);
  opacity: 1;
}

@media (max-width: 640px) {
  .resrv-banner {
    gap: 8px;
    padding: 8px 40px;
  }

  .resrv-banner__msg {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 8px;
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .resrv-banner {
    transition: visibility 0s;
  }

  .resrv-banner__arrow {
    transition: none;
  }
}
</style>
