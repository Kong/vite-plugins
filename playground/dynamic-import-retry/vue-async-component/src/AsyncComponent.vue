<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import LoadingComponent from './LoadingComponent.vue'
import ErrorComponent from './ErrorComponent.vue'

const AsyncHelloWorld = defineAsyncComponent({
  // the loader function
  loader: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return import('./HelloWorld.vue')
  },

  // A component to use while the async component is loading
  loadingComponent: LoadingComponent,

  // A component to use if the load fails
  errorComponent: ErrorComponent,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
})
</script>

<template>
  <h2>Async Component</h2>
  <div id="async-component-wrapper">
    <AsyncHelloWorld />
  </div>
</template>
