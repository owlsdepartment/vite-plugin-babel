import babel, { TransformOptions } from '@babel/core';
import { Plugin } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';

export interface BabelPluginOptions {
    filter?: RegExp;
    babelConfig?: TransformOptions;
	apply?: 'serve' | 'build';
}

const DEFAULT_FILTER = /\.jsx?$/;

const babelPlugin = ({ babelConfig = {}, filter = DEFAULT_FILTER, apply }: BabelPluginOptions = {}): Plugin => {
	return {
		name: 'babel-plugin',

		apply,
		enforce: 'pre',

		config() {
			return {
				optimizeDeps: {
					esbuildOptions: {
						plugins: [
							esbuildPluginBabel({
								filter,
								config: { ...babelConfig },
							}),
						],
					},
				},
			};
		},

		transform(code, id) {
			const shouldTransform = filter.test(id);

			if (!shouldTransform) return;

			const { code: output, map } = babel.transformSync(code, {
				filename: id,
				...babelConfig,
			}) ?? {};

			return {
				code: output ?? '',
				map,
			};
		},
	};
};

export default babelPlugin;
export * from './esbuildBabel';
