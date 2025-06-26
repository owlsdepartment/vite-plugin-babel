import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import { defineConfig } from 'rollup';

const input = 'index.ts';
const external = (id: string) => !/^[./]/.test(id);

export default defineConfig([
  {
    input,
    output: [
      {
        file: `dist/index.cjs`,
        sourcemap: false,
        format: 'cjs',
        exports: 'named',
      },
    ],

    plugins: [esbuild({ target: 'es2020' })],

    external,
  },
  {
    input,
    output: [
      {
        file: `dist/index.d.cts`,
        sourcemap: false,
        format: 'cjs',
        exports: 'named',
      },
    ],

    plugins: [dts()],

    external,
  },
  {
    input,
    output: [
      {
        file: `dist/index.mjs`,
        sourcemap: false,
        format: 'esm',
        exports: 'named',
      },
    ],

    plugins: [esbuild({ target: 'es2020' })],

    external,
  },
  {
    input,
    output: [
      {
        file: `dist/index.d.mts`,
        sourcemap: false,
        format: 'esm',
        exports: 'named',
      },
    ],

    plugins: [dts()],

    external,
  },
]);
