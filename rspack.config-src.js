const path = require('path');
const rspack = require('@rspack/core');
module.exports = {
	target: 'node18.12',
	optimization: {
    minimize: process.env.ENV !== 'dev',
  },
	output: {
    path: path.resolve(__dirname, './dist-ext'),
		filename: 'extension.js',
		library: {
      type: 'commonjs',
    },
  },
	externals: {
    vscode: 'vscode',
  },
	entry: './src/extension.ts',
  resolve: {
    tsConfig: {
      configFile: path.resolve(__dirname,  './tsconfig.rollup-src.json'),
    },
    extensions: ['...', '.ts'],
  },
  plugins: [
		new rspack.DefinePlugin({
			'ENV': JSON.stringify(process.env.ENV),
		})
	],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
          },
        ],
      },
    ],
  },
	watch: true,
};