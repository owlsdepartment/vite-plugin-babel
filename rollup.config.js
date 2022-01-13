import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'

const bundle = format => ({
	input: 'index.ts',

	output: {
		sourcemap: false,
		file: `dist/index.${format == 'dts' ? 'd.ts' : 'js'}`,
		format: format == 'dts' ? 'esm' : 'cjs',
		exports: 'named'
	},

	plugins: format == 'dts' ? [dts()] : [esbuild({ target: 'es2020' })],

	external: id => !/^[./]/.test(id),
})

export default [
	bundle('cjs'),
	bundle('dts'),
]
