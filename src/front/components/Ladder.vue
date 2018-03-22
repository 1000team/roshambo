<template>
  <div class="container">
    <div class="fill"></div>
    <div class="spinner" v-bind:class="[theme]"></div>

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

    <div class="spinner" v-bind:class="[theme]"></div>
    <div class="fill"></div>
  </div>
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
.container {
  padding-top: 25px;
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.fill {
  flex-grow: 1;
}

.spinner {
  margin: 4px;
  width: 128px;
  height: 128px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 50% 50%;
}
.spinner.dank {
  background-image: url('/assets/spinner-dank.gif');
}

.spinner.classic {
  background-image: url('/assets/spinner-classic.gif');
}

table {
  border-top-width: 3px;
  border-right-width: 3px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-spacing: 4px;
  width: 50%;
}

table.dank {
  border: 3px solid #2c2c2c;
  border-top-color: grey;
  border-left-color: grey;
}

table.classic {
  border: 3px solid purple;
  border-top-color: red;
  border-left-color: red;
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
