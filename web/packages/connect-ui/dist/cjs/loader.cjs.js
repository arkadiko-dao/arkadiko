'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-f13d5b63.js');
const patch = require('./patch-59e5cf40.js');

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patch.patchEsm().then(() => {
  return index.bootstrapLazy([["connect-modal.cjs",[[1,"connect-modal",{"authOptions":[16]}]]]], options);
  });
};

exports.defineCustomElements = defineCustomElements;
