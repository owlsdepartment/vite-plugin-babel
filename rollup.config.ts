import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import { defineConfig } from 'rollup';

type FormatType = 'dts' | 'cjs' | 'esm';
const EXTENTIONS: Record<FormatType, string> = {
	cjs: 'cjs',
	dts: 'd.ts',
	esm: 'mjs'
}

const bundle = (format: FormatType) => {
	const ext = EXTENTIONS[format];
	const file = `dist/index.${ext}`;

	return defineConfig({
		input: 'index.ts',

		output: {
			file,

			sourcemap: false,
			format: format === 'cjs' ? 'cjs' : 'esm',
			exports: 'named'
		},

		plugins: format == 'dts' ? [dts()] : [esbuild({ target: 'es2020' })],

		external: id => !/^[./]/.test(id),
	})
}

export default [
	bundle('cjs'),
	bundle('esm'),
	bundle('dts'),
]
