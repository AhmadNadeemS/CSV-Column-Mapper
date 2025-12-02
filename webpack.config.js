const path = require('path');

module.exports = {
  entry: './src/csv-mapper.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'csv-mapper.js',
    library: {
      name: 'CsvMapper',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
