import babel, { TransformOptions } from '@babel/core';
import { Filter, testFilter } from './filter';

/**
 * A Rolldown-compatible plugin that applies Babel transforms.
 * Used for `optimizeDeps.rolldownOptions.plugins` in Vite 8+,
 * where esbuild was replaced by Rolldown for dependency pre-bundling.
 */
export interface RolldownPluginBabelOptions {
	config?: TransformOptions;
	filter?: Filter;
	customFilter: (id: unknown) => boolean;
}

export const rolldownPluginBabel = ({
	config = {},
	filter = /.*/,
	customFilter,
}: RolldownPluginBabelOptions) => ({
	name: 'babel',

	async transform(code: string, id: string) {
		const shouldTransform = customFilter(id) && testFilter(filter, id);

		if (!shouldTransform) return null;

		const babelOptions = babel.loadOptions({
			filename: id,
			...config,
			caller: {
				name: 'rolldown-plugin-babel',
				supportsStaticESM: true,
			},
		}) as TransformOptions;

		if (!babelOptions) return null;

		const result = await babel.transformAsync(code, babelOptions);

		return result ? { code: result.code ?? '', map: result.map } : null;
	},
});
