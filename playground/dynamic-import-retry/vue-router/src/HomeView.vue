<script lang="ts" setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goToAbout = () => router.push('/about')
</script>

<template>
  <h2>HomeView</h2>
  <button @click="goToAbout">
    Go to About
  </button>
</template>

<style scoped>
h2 {
  color: red;
}
</style>
