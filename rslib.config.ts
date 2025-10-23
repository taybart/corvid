import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: true,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
      dom: './src/dom.ts',
      network: './src/network.ts',
      ls: './src/local_storage.ts',
      qr: './src/qr/index.ts',
    },
  },
  output: {
    target: 'web',
  },
})
