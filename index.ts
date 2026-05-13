import type { PartialConfig, InputOptions } from '@babel/core';
import * as babel from '@babel/core';
import type { Loader } from 'esbuild';
import { createFilter, type FilterPattern, type Plugin, type UserConfig, version } from 'vite';
import type { SourceMapInput, TransformResult } from 'rolldown'

import { esbuildPluginBabel } from './esbuildBabel';
import { Filter, testFilter } from './filter'

export interface BabelPluginOptions {
	apply?: Plugin['apply'];
	enforce?: Plugin['enforce'];
	babelConfig?: InputOptions;
	/**
	 * @deprecated planned for deprecation in favour of include/exclude as they should be faster
	 * and this would only accepts functions
	 */
	filter?: Filter;
	include?: FilterPattern
	exclude?: FilterPattern
	/**
	 * not supported for Vite 8+
	 */
	loader?: Loader | ((path: string) => Loader);
	optimizeOnSSR?: boolean;
}

const DEFAULT_INCLUDE = /\.jsx?$/;
const viteMajorVersion = Number(version.split('.')[0]);

const babelPlugin = ({
	babelConfig = {},
	filter,
	include = DEFAULT_INCLUDE,
	exclude,
	apply,
	enforce = 'pre',
	loader,
	optimizeOnSSR = false,
}: BabelPluginOptions = {}): Plugin => {
	const isVite8OrHigher = viteMajorVersion >= 8;
	const customFilter = createFilter(include, exclude);
	const transformFilter = (id: string) => customFilter(id) && testFilter(filter, id);

	const { getBabelOptions, updateRoot } = useBabelConfig(babelConfig);

	const transform: Plugin['transform'] = async (code, id): Promise<TransformResult | void> => {
		if (!transformFilter(id)) return;

		const babelOptions = getBabelOptions();

		return babel
			.transformAsync(code, { ...babelOptions, filename: id })
			.then((result): TransformResult => ({ code: result?.code ?? '', map: result?.map as SourceMapInput || null }));

	}

	const getOptimizeDeps = (): UserConfig['optimizeDeps'] => {
		if (isVite8OrHigher) {
			return {
				rolldownOptions: {
					plugins: [{ name: 'rolldown-plugin-babel', transform }]
				},
			}
		}

		return {
			esbuildOptions: {
				plugins: [
					esbuildPluginBabel({
						config: { ...babelConfig },
						transformFilter,
						loader,
					}),
				],
			},
		}
	}

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
			updateRoot(config.root);
		},

		transform,
	};
};

function useBabelConfig(babelConfig: InputOptions) {
	let root: string | undefined;
	let babelPartialConfig: PartialConfig | null;

	const getBabelOptions = () => {
		if (babelPartialConfig) return babelPartialConfig.options;

		babelPartialConfig = babel.loadPartialConfigSync({
			...babelConfig,
			cwd: root,
			root,
			babelrc: false,

			caller: {
				name: 'vite-plugin-babel',
				supportsStaticESM: true,
				...babelConfig.caller,
			},
		});
	}

	return {
		getBabelOptions,
		updateRoot(newRoot: string) {
			root = newRoot;
		},
	}
}

export default babelPlugin;
export * from './esbuildBabel';
export type { Filter }
