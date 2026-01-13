import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import { OutputOptions, defineConfig } from 'rollup';

const input = 'index.ts';
const external = (id: string) => !/^[./]/.test(id);

const getOutput = (format: 'cjs' | 'esm', dts = false): OutputOptions => {
  const ext = dts ? `${format === 'esm' ? 'd.mts' : 'd.cts'}` : format === 'esm' ? 'mjs' : 'cjs';
  
  return {
    file: `dist/index.${ext}`,
    sourcemap: false,
    format,
    exports: 'named',
  };
};

export default defineConfig([
  {
    input,
    output: getOutput('cjs'),
    plugins: [esbuild({ target: 'es2020' })],
    external,
  },
  {
    input,
    output: getOutput('cjs', true),
    plugins: [dts()],
    external,
  },
  { 
    input,
    output: getOutput('esm'),
    plugins: [esbuild({ target: 'es2020' })],
    external,
  },
  { 
    input,
    output: getOutput('esm', true),

    plugins: [dts()],

    external,
  },
]);
