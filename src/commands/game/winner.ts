import { Selection } from '../util'

export function getWinner(left: Selection, right: Selection) {
  if (left === right) {
    return Result.Draw
  }

  switch (left) {
    case Selection.Rock:
      return right === Selection.Scissors ? Result.Left : Result.Right

    case Selection.Paper:
      return right === Selection.Rock ? Result.Left : Result.Right

    case Selection.Scissors:
      return right === Selection.Paper ? Result.Left : Result.Right
  }

  throw new Error('Unable to determine Roshambo winner: Invalid selections')
}

export enum Result {
  Left = 1,
  Right = -1,
  Draw = 0
}
