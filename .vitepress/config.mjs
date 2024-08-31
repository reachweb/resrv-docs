import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Statamic Resrv",
  description: "Statamic Resrv is a fully featured reservations engine build using Laravel and \"living\" inside a Statamic CMS installation.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/installation' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/installation' },
          { text: 'Core Concepts', link: '/core-concepts' },
        ]
      },
      {
        text: 'Backend',
        items: [
          { text: 'Availability', link: '/availability' },
          { text: 'Extras', link: '/extras' },
          { text: 'Options', link: '/options' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
