/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CheckerPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const Dotenv = require('dotenv-webpack');

/* eslint-enable @typescript-eslint/no-var-requires */

const sourceRootPath = path.join(__dirname, 'src');
const distRootPath = path.join(__dirname, 'dist');
const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const webBrowser = process.env.WEB_BROWSER ? process.env.WEB_BROWSER : 'chrome';
const isDevelopment = nodeEnv === 'development';

const extEnv = process.env.EXT_ENV || 'web';

const hmtlProdOpts = !isDevelopment
  ? {
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }
  : {};

const getSourceMap = () => {
  if (extEnv === 'web' && nodeEnv != 'production') {
    // do not generate for production for now
    return nodeEnv === 'production' ? 'eval' : 'cheap-source-map';
  }
  return 'none';
};

const aliases =
  nodeEnv === 'development'
    ? {
        react: path.resolve('../node_modules/react'),
      }
    : {
        react: path.resolve('../node_modules/preact/compat'),
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      };

module.exports = {
  entry: {
    main: path.join(sourceRootPath, 'index.tsx'),
  },
  output: {
    path: distRootPath,
    chunkFilename: !isDevelopment ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
    filename: !isDevelopment ? '[name].[contenthash].js' : '[name].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [new TsconfigPathsPlugin()],
    alias: aliases,
  },
  optimization: {
    minimize: false,
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      chunks: 'all',
      name: 'common',
    },
    // Keep the runtime chunk separated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    // https://github.com/facebook/create-react-app/issues/5358
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              [
                '@babel/preset-env',
                { targets: { browsers: 'last 2 versions' } }, // or whatever your project requires
              ],
              '@babel/preset-typescript',
              '@babel/preset-react',
            ],
            plugins: [
              // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
              // ["@babel/plugin-proposal-decorators", { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { 'loose': true }],
              ['@babel/plugin-proposal-private-property-in-object', { 'loose': true }],
              ['@babel/plugin-proposal-private-methods', { 'loose': true }],
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              '@babel/plugin-proposal-optional-chaining',
              'babel-plugin-styled-components',
              isDevelopment && require.resolve('react-refresh/babel'),
            ].filter(Boolean),
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|ttf|otf|eot|woff2|svg)$/i,
        loader: 'file-loader',
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
    disableHostCheck: true,
    contentBase: './dist',
    port: process.env.PORT ? parseInt(process.env.PORT) : 9000,
  },
  devtool: getSourceMap(),
  watch: false,
  plugins: [
    new Dotenv(),
    new webpack.IgnorePlugin(/^\.\/wordlists\/(?!english)/, /bip39\/src$/),
    new webpack.HashedModuleIdsPlugin(),
    new CheckerPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      chunkFilename: 'styles.css',
    }),
    new HtmlWebpackPlugin({
      template: path.join(sourceRootPath, '../', 'public', 'html', 'index.html'),
      inject: 'body',
      filename: 'index.html',
      title: 'Arkadiko Finance',
      chunks: ['main', 'common'],
      ...hmtlProdOpts,
    }),

    new CopyWebpackPlugin([
      {
        from: path.join(sourceRootPath, '../', 'public', 'assets'),
        to: path.join(distRootPath, 'assets'),
        test: /\.(jpg|jpeg|png|gif|svg)?$/,
      },
    ]),
    new webpack.DefinePlugin({
      'process.env.AUTH_ORIGIN': JSON.stringify(process.env.AUTH_ORIGIN),
      NODE_ENV: JSON.stringify(nodeEnv),
      WEB_BROWSER: JSON.stringify(webBrowser),
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.ProvidePlugin({
      // you must `npm install buffer` to use this.
      Buffer: ['buffer', 'Buffer']
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
};

if (nodeEnv === 'production') {
  module.exports.plugins.push(new CleanWebpackPlugin({ verbose: true, dry: false }));
}
