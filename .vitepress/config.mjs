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
          { text: 'Search', items: 
            [
              { text: 'Overview', link: '/availability-search-component' },
              { text: 'Single Entry', link: '/availability-search-single' },
              { text: 'Multiple Entries', link: '/availability-search-multiple' },
            ] 
          },
          { text: 'Results', link: '/availability-results' },
          { text: 'Checkout', link: '/checkout' },
        ]
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Global Configuration', link: '/configuration' },
          { text: 'Payment gateways', items: 
            [
              { text: 'Stripe', link: '/stripe' },
            ] 
          },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/reachweb/statamic-resrv' }
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
