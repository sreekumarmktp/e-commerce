const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  // The entry point for our application
  entry: './src/index.tsx',

  // The output directory and filename for the bundled code
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },

  // Enable source maps for easier debugging
  devtool: 'eval-source-map',

  // Configure how modules are resolved
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  // Define rules for different file types
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Apply this rule to files ending in .ts or .tsx
        use: 'ts-loader',
        exclude: [/node_modules/, /__tests__/, /\.test\.tsx?$/],
      },
      {
        test: /\.css$/, // Apply this rule to files ending in .css
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  // Plugins
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body',
    }),
  ],

  // Development server configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    ],
  },
};
