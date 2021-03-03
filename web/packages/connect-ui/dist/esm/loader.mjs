import { b as bootstrapLazy } from './index-ad1139ae.js';
import { a as patchEsm } from './patch-f6719303.js';

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patchEsm().then(() => {
  return bootstrapLazy([["connect-modal",[[1,"connect-modal",{"authOptions":[16]}]]]], options);
  });
};

export { defineCustomElements };
