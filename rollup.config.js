import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import svelte from 'rollup-plugin-svelte';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  'react',
  'react-dom',
  'vue',
  'svelte',
  'fs',
  'path',
  'url',
  'crypto'
];

const createConfig = (input, output, needsJSX = false, needsSvelte = false) => ({
  input,
  external,
  output: [
    {
      file: output.replace('.js', '.js'),
      format: 'es',
      sourcemap: true
    },
    {
      file: output.replace('.js', '.cjs'),
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    ...(needsSvelte ? [svelte({
      compilerOptions: {
        dev: false
      }
    })] : []),
    resolve({
      preferBuiltins: true,
      browser: needsSvelte
    }),
    ...(needsJSX ? [babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx']
    })] : []),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      outDir: 'dist'
    })
  ]
});

export default [
  createConfig('src/core/index.js', 'dist/core/index.js'),
  createConfig('src/components/react/index.js', 'dist/components/react/index.js', true),
  createConfig('src/components/vue/index.js', 'dist/components/vue/index.js'),
  createConfig('src/components/svelte/index.js', 'dist/components/svelte/index.js', false, true)
];