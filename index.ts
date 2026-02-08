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
	optimizeOnSSR?: boolean;
}

const DEFAULT_FILTER = /\.jsx?$/;

const babelPlugin = ({
	babelConfig = {},
	filter = DEFAULT_FILTER,
	include,
	exclude,
	apply,
	enforce = 'pre',
	loader,
	optimizeOnSSR = false,
}: BabelPluginOptions = {}): Plugin => {
	const customFilter = createFilter(include, exclude);
	const getOptimizeDeps = () => ({
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
	})

	let root: string | undefined;
	let babelOptions: object | null;

	const getBabelOptions = () => {
		if (babelOptions) return babelOptions;

		babelOptions = babel.loadOptions({ cwd: root, root, ...babelConfig });

		return babelOptions;
	};

	return {
		name: 'babel-plugin',

		apply,
		enforce,

		config() {
			return {
				optimizeDeps: getOptimizeDeps(),
				ssr: optimizeOnSSR ? { optimizeDeps: getOptimizeDeps() } : undefined,
			};
		},

		configResolved(config) {
			root = config.root;
		},

		transform(code, id) {
			const shouldTransform = customFilter(id) && testFilter(filter, id);

			if (!shouldTransform) return;

			const babelOptions = getBabelOptions();

			return babel
				.transformAsync(code, { filename: id, ...babelOptions })
				.then((result) => ({ code: result?.code ?? '', map: result?.map }));
		},
	};
};

export default babelPlugin;
export * from './esbuildBabel';
export type { Filter }
