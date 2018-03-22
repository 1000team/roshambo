<template>
  <table border="1">
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
table {
  border-top-width: 3px;
  border-right-width: 3px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-spacing: 4px;
  border-color: grey;
}

thead,
tr {
  display: table-row;
  border-color: inherit;
}

thead {
  display: table-header-group;
  vertical-align: middle;
  border-color: inherit;
}
</style>
