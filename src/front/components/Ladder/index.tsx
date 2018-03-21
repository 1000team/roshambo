import Vue from 'vue'
import { getLeaders } from '../../../commands/leaders'
import { Mode } from '../../../commands/util'
import Ranking from './Ranking'

type Leaders = ReturnOf<typeof getLeaders>
type Props = { [Key in Mode]: Leaders }

const Ladder = Vue.component<Props>('Ladder', {
  functional: true,
  // props: {
  //   classic: [],
  //   ls: []
  // },
  render(h, ctx) {
    const data = ctx.data as typeof ctx.props
    console.log('Ladder', data)
    return (
      <table>
        <thead>
          <th>#</th>
          <th>Name</th>
          <th>Rating</th>
        </thead>

        {data.ls.map(row => <Ranking {...row} />)}
      </table>
    )
  }
})

export default Ladder
