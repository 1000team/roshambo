import Vue from 'vue'
import Ladder from '../Ladder'

const App = Vue.component('App', {
  data() {
    return {
      ladders: {
        classic: [],
        ls: []
      }
    }
  },
  async mounted() {
    console.log('Mounted')
    const ladders = await fetch('/api', { method: 'GET' })
    const json = await ladders.json()
    // this.ladders = json
    this.$set(this, 'ladders', json)
  },
  updated() {
    console.log('Updated', this.$data.ladders)
  },
  render(h, ctx) {
    const props = {
      ...this.$data.ladders
    }
    console.log('App', this.$data)
    return (
      <div>
        Hello world!
        <Ladder {...props} />
      </div>
    )
  }
})

export default App
