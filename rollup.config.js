import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import RollupTypescript from 'rollup-plugin-typescript2'
import pkg from './package.json';
import NodePath from 'path'
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import postcss from 'rollup-plugin-postcss'
const resolveFile = path => NodePath.resolve(__dirname, path);
const bigCamel = (name) => name.split('-').map(it => it[0].toUpperCase() + it.slice(1)).join(''); 

export default [
	// browser-friendly UMD build
	{
		input: 'front/index.ts',
		output: {
			file: pkg.browser,
      name: bigCamel(pkg.name),
			format: 'umd'
		},
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs(), // so Rollup can convert `ms` to an ES module
			postcss({
				extract: true,
				// Or with custom file name
				extract: NodePath.resolve('dist/index.css')
			}),
			RollupTypescript({
				tsconfig: resolveFile('tsconfig.rollup.json')
			}),
			injectProcessEnv({
				NODE_ENV: 'production',
			}),
		]
	},
	{
		input: 'src/extension.ts',
		output: {
			file: pkg.distExt,
			format: 'cjs'
		},
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs(), // so Rollup can convert `ms` to an ES module
			RollupTypescript({
				tsconfig: resolveFile('tsconfig.rollup-src.json')
			}),
			injectProcessEnv({
				NODE_ENV: 'production',
			}),
		]
	},
	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	// {
	// 	input: 'src/index.ts',
	// 	output: [
	// 		{ file: pkg.main, format: 'cjs' },
	// 		{ file: pkg.module, format: 'es' }
	// 	],
  //   plugins: [
  //     RollupTypescript({
  //       tsconfig: resolveFile('tsconfig.rollup.json')
  //     }),
	// 	]
	// }
];
