<template>
<div class="app" v-bind:class="[theme]">
  <div class="button" v-on:click="changeTheme">change theme</div>
  <ladder v-bind:ladder="ladder" v-bind:theme="theme" />
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Ranking } from '../../commands/leaders'
import { setInterval } from 'timers'

export default Vue.component('app', {
  data() {
    return {
      ladder: [] as Ranking[],
      theme: 'dank'
    }
  },
  async mounted() {
    this.refreshLadder()
    setInterval(() => this.refreshLadder(), 10000)
  },
  methods: {
    changeTheme() {
      this.theme = this.theme === 'dank' ? 'classic' : 'dank'
    },
    async refreshLadder() {
      const ladders = await fetch('/api', { method: 'GET' })
      const json = await ladders.json()
      this.ladder = json.ls
    }
  }
})
</script>

<style scoped>
.button {
  box-sizing: border-box;
  border: 5px solid #959595;
  border-top-color: #fff;
  border-left-color: #fff;
  width: 140px;
  height: 35px;
  display: inline-block;
  background-color: #c3c3c3;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.75);
  font-size: 13px;
  color: #000;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  margin: 0 0 3px;
  cursor: pointer;
}
.app {
  font-family: 'Comic Sans MS', 'Comic Neue', sans-serif;
  padding: 8px;
  height: 100vh;
}

.app.dank {
  background-image: url('/assets/dank.png');
}

.app.classic {
  background-image: url('/assets/classic.png');
  color: white;
}
</style>
