const path = require('path');
const rspack = require('@rspack/core');

module.exports = {
	devServer: {
    allowedHosts: 'all',
		/** 允许跨域 */
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
			"Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
		},
		host: '127.0.0.1',
		port: 8080,
		hot: true,
		client: {
      overlay: {
        runtimeErrors: (error) => {
          if(error?.message === "ResizeObserver loop completed with undelivered notifications.")
          {
             console.error(error)
             return false;
          }
          return true;
        },
      },
    },
		// watchFiles: ['front/**/*'],
		// liveReload: true,
  },
	optimization: {
    minimize: process.env.ENV !== 'dev',
		minimizer: process.env.ENV !== 'dev' ? [
			new rspack.SwcJsMinimizerRspackPlugin({
				minimizerOptions: {
					compress: {
						drop_console: true,
						drop_debugger: true,
					},
				},
			}),
			new rspack.LightningCssMinimizerRspackPlugin()
		] : undefined
  },
	experiments: {
    css: true,
  },
	output: {
    path: path.resolve(__dirname, './dist'),
		filename: 'index.js',
		library: {
			name: 'Van',
      type: 'umd',
    },
  },
	externals: {
    vscode: 'vscode',
  },
	entry: {
		index: {
      import: ['./front/reload.ts', './front/index.ts'],
    }
	},
  resolve: {
    tsConfig: {
      configFile: path.resolve(__dirname,  './tsconfig.rollup.json'),
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
					{
						loader: path.resolve('./front/hmr-loader.js')
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
			{
				test: /\.(png|jpg|jpeg|gif|svg)$/,
				type: 'asset/resource',
				// 可选：自定义输出文件名和路径
				generator: {
					filename: '[hash][ext][query]' // 图片输出到 dist/assets/images 目录
				}
			}
    ],
  },
	watch: process.env.ENV === 'dev',
};