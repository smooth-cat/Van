const path = require('path');
const rspack = require('@rspack/core');

module.exports = {
	optimization: {
    minimize: process.env.ENV !== 'dev',
  },
	experiments: {
    css: true,
  },
	output: {
    path: path.resolve(__dirname, './dist'),
		filename: 'index.js',
		library: {
			name: 'CodeGuide',
      type: 'umd',
    },
  },
	externals: {
    vscode: 'vscode',
  },
	entry: './front/index.ts',
  resolve: {
    tsConfig: {
      configFile: path.resolve(__dirname,  './tsconfig.rollup.json'),
    },
    extensions: ['...', '.ts'],
  },
  plugins: [],
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
			{
        test: /\.less$/,
        use: [
          {
            loader: 'less-loader',
          },
        ],
        type: 'css',
      },
			// {
      //   test: /\.css$/i,
      //   use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
      //   type: 'javascript/auto',
      // },
    ],
  },
	watch: true,
};