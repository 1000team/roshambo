import Vue, { VNode } from 'vue'

declare global {
  type ReturnOf<T> = T extends ((...args: any[]) => infer R) ? R : T

  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any
    }
  }
}
