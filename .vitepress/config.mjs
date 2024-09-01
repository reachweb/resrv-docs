import { defineConfig } from 'vitepress'
import { createHighlighter } from 'shiki'
import path from 'path'
import {readFileSync} from "fs"

const antlersDef = JSON.parse(readFileSync(path.resolve(__dirname, './languages/antlers.tmLanguage.json'), 'utf8'))

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
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Setup', link: '/frontend-setup' },
          { text: 'Search', link: '/availability-search' },
          { text: 'Results', link: '/availability-search' },
          { text: 'Checkout', link: '/checkout' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
  },
  markdown: {
    shikiSetup: async (highlighter) => {
      await highlighter.loadLanguage({        
        scopeName: 'text.html.statamic',
        embeddedLangs: ['html'],
        ...antlersDef,
        name: 'antlers',
      })
    },
  },
})
