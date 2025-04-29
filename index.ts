import babel, { TransformOptions } from '@babel/core';
import { Loader } from 'esbuild';
import { createFilter, FilterPattern, Plugin } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';
import { Filter, testFilter } from './filter'

export interface BabelPluginOptions {
	apply?: Plugin['apply'];
	enforce?: Plugin['enforce'];
	babelConfig?: TransformOptions;
	filter?: Filter;
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
	enforce = 'pre',
	loader
}: BabelPluginOptions = {}): Plugin => {
	const customFilter = createFilter(include, exclude)

	return {
		name: 'babel-plugin',

		apply,
		enforce,

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
			const shouldTransform = customFilter(id) && testFilter(filter, id);

			if (!shouldTransform) return;

			return babel
				.transformAsync(code, { filename: id, ...babelConfig })
				.then((result) => ({ code: result?.code ?? '', map: result?.map }));
		},
	};
};

export default babelPlugin;
export * from './esbuildBabel';
export type { Filter }
