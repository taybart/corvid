import { defineConfig } from '@rslib/core'
import pkg from './package.json'

const entry = {
  index: './src/index.ts',
  dom: './src/dom.ts',
  style: './src/style.ts',
  network: './src/network.ts',
  ls: './src/local_storage.ts',
  qr: './src/qr/index.ts',
  utils: './src/utils.ts',
  strings: './src/strings.ts',
}

const jsBanner = `/*! @taybart/corvid v${pkg.version} | Copyright (c) 2025 Taylor Bartlett | BSD-3-Clause | https://github.com/taybart */`
const dtsBanner = `// @taybart/corvid v${pkg.version} | Copyright (c) 2025 Taylor Bartlett | BSD-3-Clause | https://github.com/taybart`

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: true,
      source: { entry },
      banner: { js: jsBanner, dts: dtsBanner },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      source: {
        entry: { index: entry.index },
      },
      output: {
        distPath: {
          root: 'dist/bundle',
        },
        filename: {
          js: 'corvid.bundle.js',
        },
        minify: true,
      },
      banner: { js: jsBanner },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      source: {
        entry: { dom: entry.dom },
      },
      output: {
        distPath: {
          root: 'dist/bundle',
        },
        filename: {
          js: 'dom.bundle.js',
        },
        minify: true,
      },
      banner: { js: jsBanner },
    },
  ],
  source: {
    tsconfigPath: './tsconfig.build.json',
  },
  output: {
    target: 'web',
  },
})
