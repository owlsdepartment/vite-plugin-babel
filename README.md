# Vite Plugin Babel Dev

Run babel during dev server in Vite.

## Motivations

Vite comes with Babel out of box, but runs it only during `build` and only other possible why to do this is via [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react). ESBuild is awesome tool, but doesn't support some experimental features, like decorators ([issue #2349](https://github.com/vitejs/vite/issues/2349)) or class instance fields, out of box. You can use them only in TypeScript, but not pure JS. This plugin was made to enable usage of such features and runs babel during `optimizeDeps` and `dev` stages.

## Instalation

```bash
# yarn
yarn add -D vite-plugin-babel-dev

# npm
npm install -D vite-plugin-babel-dev
```

## Usage

Add it to your Vite config

```js
import { defineConfig } from 'vite';
import babelDev from 'vite-plugin-babel-dev';

export default defineConfig({
    plugins: [
        babelDev({
            babelConfig: {
                plugin: ['@babel/plugin-proposal-decorators']
            }
        }),
        // ...
    ],

    // ...
})
```

## Config

Babel config can be either passed to `babelConfig` field or via `.babelrc` type of file. For all babel options see: [Babel Options](https://babeljs.io/docs/en/options).

By default, babel is run only for JS/JSX files. You can change that vie `filter` option.

| Name | Type | Default | Description |
| -- | -- | -- | -- |
| `babelConfig` | `object` | `{}` | [Babel Options](https://babeljs.io/docs/en/options) |
| `filter` | `RegExp` | `/\.jsx?$/` | wich files is babel applied to. By default it's js/jsx files |

## Tips

Vite team didn't enabled it by default, because they wanted to keep dev environment as fast as possible. Because of that, we recommend to only include those Babel plugins you really need. You can use option `babelConfig.plugin` and disable usage of babel config file, ex.:

```js
babelDev({
    babelConfig: {
        babelrc: false,
        configFile: false,
        plugin: ['@babel/plugin-proposal-decorators']
    }
})
```

or just use `.babelrc.json` that will be also used during build process.

__NOTE:__ Any babel plugins and presets need to be installed seperately and are not included with this package.

## License

Library is under [MIT License](LICENSE)
