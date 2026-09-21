import { defineConfig } from '@rslib/core'

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

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: true,
      source: { entry },
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
      },
    },
  ],
  source: {
    tsconfigPath: './tsconfig.build.json',
  },
  output: {
    target: 'web',
  },
})
