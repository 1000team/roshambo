import * as process from 'process'
import * as path from 'path'

export = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: './src/front/index.ts',
  output: {
    path: path.resolve(process.cwd(), 'src', 'front'),
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm.js'
    },
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json'
            }
          }
        ]
      }
    ]
  }
}
