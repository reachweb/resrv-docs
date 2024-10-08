import { defineConfig } from 'vitepress'
import { createHighlighter } from 'shiki'
import path from 'path'
import {readFileSync} from "fs"

const antlersDef = JSON.parse(readFileSync(path.resolve(__dirname, './languages/antlers.tmLanguage.json'), 'utf8'))

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Statamic Resrv",
  cleanUrls: true,
  sitemap: {
    hostname: 'https://resrv.dev'
  },
  head: [
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#f78964' }],
    ['meta', { name: 'msapplication-TileColor', content: '#2b5797' }],
    ['meta', { name: 'theme-color', content: '#f78964' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@afonic' }],
    ['meta', { name: 'twitter:creator', content: '@afonic' }],
    ['meta', { name: 'twitter:title', content: 'Resrv - Booking system addon-on for Statamic' }],
    ['meta', { name: 'twitter:description', content: 'Resrv is a fully featured reservations add-on for Statamic and Laravel.' }],
    ['meta', { name: 'twitter:image', content: 'https://resrv.dev/resrv-sm.webp' }],
    ['meta', { property: 'og:title', content: 'Resrv - Booking system addon-on for Statamic' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://resrv.dev' }],
    ['meta', { property: 'og:image', content: 'https://resrv.dev/resrv-sm.webp' }],
    ['meta', { property: 'og:description', content: 'Resrv is a fully featured reservations add-on for Statamic and Laravel.' }],
  ],
  description: "Statamic Resrv is a fully featured reservations engine build using Laravel and \"living\" inside a Statamic CMS installation.",
  themeConfig: {
    logo: { 
      light: '/logo-light.svg', 
      dark: '/logo-dark.svg', 
      alt: 'Statamic Resrv' 
    },
    footer: {
      copyright: 'Copyright © 2024 Reach Web Agency'
    },
    siteTitle: false,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/installation' },
      { text: 'Purchase', link: 'https://statamic.com/addons/reach/resrv' }
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
          { text: 'Dynamic Pricing', link: '/dynamic-pricing' },
          { text: 'Fixed Pricing', link: '/fixed-pricing' },
          { text: 'Reservations', link: '/reservations' },
          { text: 'Affiliates', link: '/affiliates' },
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
          { text: 'Guests', link: '/guests' },
        ]
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Global Configuration', link: '/configuration' },
          { text: 'Payment gateways', items: 
            [
              { text: 'Stripe', link: '/stripe' },
              { text: 'Mollie', link: '/mollie' },
            ] 
          },
          { text: 'Languages', link: '/languages' },
          { text: 'Emails', link: '/emails' },
        ]
      },
      { text: 'Support & Pricing', link: '/support' },
    ],

    search: {
      provider: 'local'
    },

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
