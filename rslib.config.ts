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
      qr: './src/qr/index.ts',
    },
  },
  output: {
    target: 'web',
  },
})
