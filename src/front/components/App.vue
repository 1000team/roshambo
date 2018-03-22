<template>
  <ladder v-bind:ladder="ladder" />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.component('app', {
  data() {
    return {
      ladder: []
    }
  },
  async mounted() {
    const ladders = await fetch('/api', { method: 'GET' })
    const json = await ladders.json()
    this.ladder = json.ls
  }
})
</script>
