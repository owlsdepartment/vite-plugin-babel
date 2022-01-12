import babel, { TransformOptions } from '@babel/core';
import { Plugin } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';

export interface BabelDevOptions {
    filter?: RegExp;
    babelConfig?: TransformOptions;
}

const DEFAULT_FILTER = /\.jsx?$/;

const babelDevPlugin = ({ babelConfig = {}, filter = DEFAULT_FILTER }: BabelDevOptions = {}): Plugin => {
	return {
		name: 'babel-dev-plugin',

		enforce: 'pre',
		apply: 'serve',

		config() {
			return {
				optimizeDeps: {
					esbuildOptions: {
						plugins: [
							esbuildPluginBabel({
								filter,
								config: {
									...babelConfig,
								},
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
				...babelConfig,
			}) ?? {};

			return {
				code: output ?? '',
				map,
			};
		},
	};
};

export default babelDevPlugin;
export * from './esbuildBabel';
