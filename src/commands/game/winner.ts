export function getWinner(left: string, right: string) {
  if (left === right) {
    return Result.Draw
  }

  switch (left) {
    case 'rock':
      return right === 'scissors' ? Result.Left : Result.Right

    case 'paper':
      return right === 'rock' ? Result.Left : Result.Right

    case 'scissors':
      return right === 'paper' ? Result.Left : Result.Right
  }

  throw new Error('Unable to determine Roshambo winner: Invalid selections')
}

export enum Result {
  Left = 1,
  Right = -1,
  Draw = 0
}
