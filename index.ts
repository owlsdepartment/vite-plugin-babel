import babel, { PartialConfig, TransformOptions } from '@babel/core';
import { Loader } from 'esbuild';
import { createFilter, FilterPattern, Plugin, UserConfig, version } from 'vite';

import { esbuildPluginBabel } from './esbuildBabel';
import { Filter, testFilter } from './filter'

export interface BabelPluginOptions {
	apply?: Plugin['apply'];
	enforce?: Plugin['enforce'];
	babelConfig?: TransformOptions;
	/**
	 * @deprecated Use `include` / `exclude` instead.
	 *
	 * `filter` is combined with `include` as an AND, and since 1.7.0 `include`
	 * defaults to `/\.jsx?$/`. Files outside that default are filtered out
	 * before `filter` runs, so passing only `filter` cannot expand the file
	 * scope. Set `include` explicitly to match your filter, or migrate to
	 * `include` / `exclude` entirely.
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
	include,
	exclude,
	apply,
	enforce = 'pre',
	loader,
	optimizeOnSSR = false,
}: BabelPluginOptions = {}): Plugin => {
	const isVite8OrHigher = viteMajorVersion >= 8;

	// Help users migrating from 1.6.x: `filter` is now AND-ed with `include`,
	// which defaults to `/\.jsx?$/`. If they relied on `filter` alone to scope
	// to other extensions, those files are silently skipped — surface the
	// migration path instead of leaving Babel transforms unapplied.
	if (filter !== undefined && include === undefined) {
		console.warn(
			'[vite-plugin-babel] `filter` is applied after `include` (default since 1.7.0: `/\\.jsx?$/`). ' +
			'Files outside that default are skipped. ' +
			'Set `include` explicitly to match your filter, or migrate to `include` / `exclude` entirely.'
		);
	// Apply default include value for users that never overwritten filter
	} else if (include === undefined) {
		include = DEFAULT_INCLUDE;
	}

	const customFilter = createFilter(include, exclude);
	const transformFilter = (id: string) => customFilter(id) && testFilter(filter, id);

	const { getBabelOptions, updateRoot } = useBabelConfig(babelConfig);

	const transform: Plugin['transform'] = async (code, id) => {
		if (!transformFilter(id)) return;

		const babelOptions = getBabelOptions();

		return babel
			.transformAsync(code, { ...babelOptions, filename: id })
			.then((result) => ({ code: result?.code ?? '', map: result?.map }));

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

function useBabelConfig(babelConfig: TransformOptions) {
	let root: string | undefined;
	let babelPartialConfig: PartialConfig | null;

	const getBabelOptions = () => {
		if (babelPartialConfig) return babelPartialConfig.options;

		babelPartialConfig = babel.loadPartialConfig({
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

		return babelPartialConfig?.options ?? {};
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
