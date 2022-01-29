#!/usr/bin/env node
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { build } = require('estrella');
const { sync } = require('fast-glob');
const { createProgram } = require('typescript');

const buildFiles = sync('src/**/*');
build({
  entryPoints: buildFiles,
  sourcemap: 'both',
  target: 'es2020',
  platform: 'node',
  tsconfig: '../../tsconfig.json',
  outdir: 'build',
  format: 'cjs',
  plugins: [nodeExternalsPlugin()],
});

createProgram(buildFiles, {
  declaration: true,
  declarationMap: true,
  emitDeclarationOnly: true,
  rootDir: 'src',
  outDir: 'build',
}).emit();
