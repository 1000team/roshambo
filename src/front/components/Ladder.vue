<template>
  <table class="table">
    <thead>
      <th>#</th>
      <th>Name</th>
      <th>Rating</th>
    </thead>
    <tbody>
      <tr v-for="row in ladder" v-bind:key="row.position">
        <td>{{ row.position }}</td>
        <td>{{ row.name }}</td>
        <td>{{ row.stats.rating }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.component('ladder', {
  props: ['ladder']
})
</script>

<style scoped>
.table {
  border: 5px solid;
}
</style>
