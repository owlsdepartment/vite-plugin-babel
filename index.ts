import babel, { TransformOptions } from '@babel/core';
import { Loader } from 'esbuild';
import { createFilter, FilterPattern, Plugin } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';

export interface BabelPluginOptions {
	apply?: 'serve' | 'build';
	babelConfig?: TransformOptions;
	filter?: RegExp;
	include?: FilterPattern
	exclude?: FilterPattern
	loader?: Loader | ((path: string) => Loader);
}

const DEFAULT_FILTER = /\.jsx?$/;

const babelPlugin = ({
	babelConfig = {},
	filter = DEFAULT_FILTER,
	include,
	exclude,
	apply,
	loader
}: BabelPluginOptions = {}): Plugin => {
	const customFilter = createFilter(include, exclude)

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
								config: { ...babelConfig },
								customFilter,
								filter,
								loader,
							}),
						],
					},
				},
			};
		},

		transform(code, id) {
			const shouldTransform = customFilter(id) && filter.test(id);

			if (!shouldTransform) return;

			return babel
				.transformAsync(code, { filename: id, ...babelConfig })
				.then((result) => ({ code: result?.code ?? '', map: result?.map }));
		},
	};
};

export default babelPlugin;
export * from './esbuildBabel';
