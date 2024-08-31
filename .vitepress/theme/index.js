// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import Image from '../components/Image.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // register your custom global components
    app.component('Image', Image)
  }
}