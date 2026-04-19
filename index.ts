import {
  InputOptions,
  PartialConfig,
  loadPartialConfigSync,
  transformAsync,
} from "@babel/core";
import { Loader } from "esbuild";
import { SourceMapInput } from "rollup";
import { createFilter, FilterPattern, Plugin } from "vite";

import { esbuildPluginBabel } from "./esbuildBabel";
import { Filter, testFilter } from "./filter";

export interface BabelPluginOptions {
  apply?: Plugin["apply"];
  enforce?: Plugin["enforce"];
  babelConfig?: InputOptions;
  filter?: Filter;
  include?: FilterPattern;
  exclude?: FilterPattern;
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
  enforce = "pre",
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
  });

  let root: string | undefined;
  let babelPartialConfig: PartialConfig | null;

  const getBabelOptions = () => {
    if (babelPartialConfig) return babelPartialConfig.options;

    babelPartialConfig = loadPartialConfigSync({
      cwd: root,
      root,
      ...babelConfig,
    });

    return babelPartialConfig?.options ?? {};
  };

  return {
    name: "babel-plugin",

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

      return transformAsync(code, { ...babelOptions, filename: id }).then(
        (result) => {
          const map: SourceMapInput | undefined = result?.map
            ? {
                version: result.map.version,
                file: result.map.file ?? undefined,
                sourceRoot: result.map.sourceRoot,
                sources: result.map.sources.map((source) => source ?? ""),
                sourcesContent: result.map.sourcesContent
                  ? result.map.sourcesContent.map((content) => content ?? "")
                  : undefined,
                names: [...result.map.names],
                mappings: result.map.mappings,
              }
            : undefined;

          return { code: result?.code ?? "", map };
        },
      );
    },
  };
};

export default babelPlugin;
export * from "./esbuildBabel";
export type { Filter };
