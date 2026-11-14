<script setup>
import DefaultTheme from 'vitepress/theme'
import Banner from '../components/Banner.vue'
import StatsBand from '../components/StatsBand.vue'
import Showcase from '../components/Showcase.vue'
import Audience from '../components/Audience.vue'
import CtaBand from '../components/CtaBand.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <Banner />
    </template>
    <!-- Home page only: these slots render nothing on other layouts. -->
    <template #home-features-before>
      <StatsBand />
    </template>
    <template #home-features-after>
      <Showcase />
      <Audience />
      <CtaBand />
    </template>
  </Layout>
</template>
