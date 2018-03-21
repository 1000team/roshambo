import app from './server'

export function startApi() {
  return new Promise<void>((resolve, reject) => {
    app.listen(3000, (err: any) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
