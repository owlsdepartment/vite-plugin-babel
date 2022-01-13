import babel, { TransformOptions } from '@babel/core';
import { OnLoadArgs, Plugin } from 'esbuild';
import fs from 'fs';
import path from 'path';

/**
 * Original: https://github.com/nativew/esbuild-plugin-babel
 * Copied, because there was a problem with `type: "module"` in `package.json`
 */
export interface ESBuildPluginBabelOptions {
	filter?: RegExp;
	namespace?: string;
	config?: TransformOptions;
}

export const esbuildPluginBabel = (options: ESBuildPluginBabelOptions = {}): Plugin => ({
	name: 'babel',

	setup(build) {
		const { filter = /.*/, namespace = '', config = {} } = options;

		const transformContents = ({ args, contents }: { args: OnLoadArgs, contents: string }) => {
			const babelOptions = babel.loadOptions({
				filename: args.path,
				...config,
				caller: {
					name: 'esbuild-plugin-babel',
					supportsStaticESM: true,
				},
			}) as any;
			if (!babelOptions) return { contents };

			if (babelOptions.sourceMaps) {
				const filename = path.relative(process.cwd(), args.path);

				babelOptions.sourceFileName = filename;
			}

			return new Promise<{ contents: string }>((resolve, reject) => {
				babel.transform(contents, babelOptions, (error, result) => {
					error ? reject(error) : resolve({ contents: result?.code ?? '' });
				});
			});
		};

		build.onLoad({ filter, namespace }, async args => {
			const contents = await fs.promises.readFile(args.path, 'utf8');

			return transformContents({ args, contents });
		});
	},
});
