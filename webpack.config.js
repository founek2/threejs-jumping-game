const HtmlWebPackPlugin = require("html-webpack-plugin");
const DashboardPlugin = require('webpack-dashboard/plugin');

module.exports = {
      entry: './src/index2.js',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader"
            }
          },
          {
            test: /\.html$/,
            use: [
              {
                loader: "html-loader",
                options: { minimize: true }
              }
            ]
          },
          {
            test: /\.(jpg|png|svg)$/,
            loader: 'file-loader',
            include: __dirname + "/src",
          }
        ]
      },
      plugins: [
            new DashboardPlugin(),
            new HtmlWebPackPlugin({
              template: "./src/index.html",
              filename: "./index.html"
            }),
          ]
    };