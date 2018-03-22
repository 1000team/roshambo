<template>
  <table border="1" v-bind:class="[theme]">
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
import { Ranking } from '../../commands/leaders'

export default Vue.component('ladder', {
  props: {
    ladder: {
      default: [] as Ranking[],
      required: false
    },
    theme: {
      default: 'classic',
      required: false
    }
  }
})
</script>

<style scoped>
table {
  border-top-width: 3px;
  border-right-width: 3px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-spacing: 4px;
}

table.dank {
  border-color: blue;
}

table.classic {
  border-color: purple;
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
