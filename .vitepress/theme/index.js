// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import Image from '../components/Image.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  // wrapper Layout that injects the announcement banner into the layout-top slot
  Layout,
  enhanceApp({ app }) {
    // register your custom global components
    app.component('Image', Image)
  }
}