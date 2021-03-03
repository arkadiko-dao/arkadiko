'use strict';

const index = require('./index-f13d5b63.js');
const patch = require('./patch-59e5cf40.js');

patch.patchBrowser().then(options => {
  return index.bootstrapLazy([["connect-modal.cjs",[[1,"connect-modal",{"authOptions":[16]}]]]], options);
});
