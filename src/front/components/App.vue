<template>
  <ladder v-bind:ladder="ladder" v-bind:theme="theme" />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.component('app', {
  data() {
    return {
      ladder: [],
      theme: 'dank'
    }
  },
  async mounted() {
    const ladders = await fetch('/api', { method: 'GET' })
    const json = await ladders.json()
    this.ladder = json.ls
  }
})
</script>
