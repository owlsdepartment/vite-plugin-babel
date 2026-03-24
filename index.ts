import babel, { PartialConfig, TransformOptions } from '@babel/core';
import { Loader } from 'esbuild';
import { createFilter, FilterPattern, Plugin, version as viteVersion } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';
import { rolldownPluginBabel } from './rolldownBabel';
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
	const viteMajor = parseInt(viteVersion.split('.')[0], 10);

	const getOptimizeDeps = () => {
		// Vite 8+ replaced esbuild with Rolldown for dependency pre-bundling.
		// Use rolldownOptions with a Rolldown-compatible plugin; fall back to
		// the legacy esbuildOptions for older Vite versions.
		if (viteMajor >= 8) {
			return {
				rolldownOptions: {
					plugins: [
						rolldownPluginBabel({
							config: { ...babelConfig },
							customFilter,
							filter,
						}),
					],
				},
			};
		}

		return {
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
		};
	}

	let root: string | undefined;
	let babelPartialConfig: PartialConfig | null;

	const getBabelOptions = () => {
		if (babelPartialConfig) return babelPartialConfig.options;

		babelPartialConfig = babel.loadPartialConfig({ cwd: root, root, ...babelConfig });

		return babelPartialConfig?.options ?? {};
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
				.transformAsync(code, {  ...babelOptions, filename: id })
				.then((result) => ({ code: result?.code ?? '', map: result?.map }));
		},
	};
};

export default babelPlugin;
export * from './esbuildBabel';
export * from './rolldownBabel';
export type { Filter }
