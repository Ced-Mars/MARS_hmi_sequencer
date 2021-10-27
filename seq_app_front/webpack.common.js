const HtmlWebpackPlugin = require("html-webpack-plugin");
const deps = require("./package.json").dependencies;
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
module.exports = {
  entry: "./src/index.js",
  output: {
    path: __dirname + "/seq_app_backend/dist",
    filename: "[name].bundle.js",
    clean: true,
  },
  module: {
    rules: [
      {
        /* The following line to ask babel 
             to compile any file with extension
             .js */
        test: /\.js?$/,
        /* exclude node_modules directory from babel. 
            Babel will not compile any files in this directory*/
        exclude: /node_modules/,
        // To Use babel Loader
        loader: "babel-loader",
        options: {
          presets: [
            "@babel/preset-env" /* to transfer any advansed ES to ES5 */,
            "@babel/preset-react",
          ], // to compile react to ES5
        },
      },
      {
        test: /\.(css)$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'RemoteSeq', // this name needs to match with the entry name
      filename: "remoteEntry.js",
      exposes:{
        "./SeqComm": "./src/Dialogue",
        "./SeqLaunch": "./src/Launch"
      },
      shared: {
        ...deps
      },
    }),
    new HtmlWebpackPlugin({
      title: 'Production-SeqApp',
      template: './public/index.html'
    }),
  ],
};
