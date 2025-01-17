<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import LoadingComponent from './LoadingComponent.vue'
import ErrorComponent from './ErrorComponent.vue'

const params = new URLSearchParams(window.location.search)
const latency = Number(params.get('latency')) || 500
const timeout = Number(params.get('timeout')) || 1000

const AsyncHelloWorld = defineAsyncComponent({
  // the loader function
  loader: async () => {
    await new Promise((resolve) => setTimeout(resolve, latency))
    return import('./HelloWorld.vue')
  },

  // A component to use while the async component is loading
  loadingComponent: LoadingComponent,

  // A component to use if the load fails
  errorComponent: ErrorComponent,

  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout,
})
</script>

<template>
  <AsyncHelloWorld />
</template>
