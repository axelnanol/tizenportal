import { string } from 'rollup-plugin-string';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

// Read version from package.json - single source of truth
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const VERSION = pkg.version;

// Shared plugins
const plugins = [
  // Replace __VERSION__ placeholder with actual version from package.json
  replace({
    preventAssignment: true,
    values: {
      '__VERSION__': VERSION,
    },
  }),

  // Import CSS files as strings
  string({
    include: '**/*.css',
  }),

  // Resolve imports from node_modules
  nodeResolve({
    browser: true,
    preferBuiltins: false,
  }),

  // Convert CommonJS modules to ES modules
  commonjs({
    include: [/node_modules/],
    transformMixedEsModules: true,
  }),

  // Transpile to ES5 for Chrome 47+ compatibility
  babel({
    babelHelpers: 'bundled',
    presets: [
      ['@babel/preset-env', {
        targets: {
          chrome: '47',
        },
        modules: false,
      }],
    ],
    exclude: 'node_modules/**',
  }),

  // Minify for production
  terser({
    ecma: 5,
    mangle: true,
    compress: {
      drop_console: false, // Keep console.log for diagnostics
    },
  }),
];

export default [
  // Build: TizenPortal universal runtime
  // Output to both app/ (for development) and dist/ (for deployment)
  {
    input: 'core/index.js',
    output: [
      {
        file: 'app/tizenportal.js',
        format: 'iife',
        name: 'TizenPortal',
        sourcemap: false,
      },
      {
        file: 'dist/tizenportal.js',
        format: 'iife',
        name: 'TizenPortal',
        sourcemap: false,
      },
    ],
    plugins,
  },
];