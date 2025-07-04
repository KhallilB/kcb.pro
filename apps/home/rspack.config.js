const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');
const { NxReactRspackPlugin } = require('@nx/rspack/react-plugin');
const { RspackManifestPlugin } = require('rspack-manifest-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  experiments: { 
    outputModule: true 
  },
  output: {
    path: require('path').join(__dirname, '../../dist/apps/home'),
    globalObject: 'globalThis',
    filename: isProd ? '[name].[contenthash].mjs' : '[name].mjs',
    chunkFilename: isProd ? '[name].[contenthash].mjs' : '[name].mjs',
    publicPath: isProd
      ? 'https://cdn.example.com/home/'
      : 'http://localhost:4201/',
    clean: true,
    module: true,
    library: {
      type: 'module'
    },
    environment: {
      module: true,
      dynamicImport: true
    }
  },
  target: 'web',
  devServer: {
    port: 4201,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: true,
      htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
    },
  },
  externals: { 
    react: 'React', 
    'react-dom': 'ReactDOM' 
  },
  plugins: [
    new RspackManifestPlugin({
      fileName: 'manifest-home.json',
      publicPath: isProd ? 'https://cdn.example.com/home/' : 'http://localhost:4201/',
      writeToFileEmit: true,
    }),
    new NxAppRspackPlugin({
      tsConfig: './tsconfig.app.json',
      main: './src/module-entry.tsx',
      index: './src/index.html',
      baseHref: '/',
      assets: ['./src/favicon.ico', './src/assets'],
      styles: ['./src/styles.css'],
      outputHashing: isProd ? 'all' : 'none',
      optimization: isProd, // Fixed: was isProd === 'production'
    }),
    new NxReactRspackPlugin(),
  ],
};