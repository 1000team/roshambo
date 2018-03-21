import Vue from 'vue'
import { Ranking } from '../../../commands/leaders'

const Ranking = Vue.component<Ranking>('Ranking', {
  functional: true,
  render(h, ctx) {
    const props = ctx.data as typeof ctx.props
    console.log('Ranking', props)
    return (
      <tr>
        <td>{props.position}</td>
        <td>{props.name}</td>
        <td>{props.stats.rating}</td>
      </tr>
    )
  }
})

export default Ranking
