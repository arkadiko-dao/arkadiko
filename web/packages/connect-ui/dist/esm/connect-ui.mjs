import { b as bootstrapLazy } from './index-ad1139ae.js';
import { p as patchBrowser } from './patch-f6719303.js';

patchBrowser().then(options => {
  return bootstrapLazy([["connect-modal",[[1,"connect-modal",{"authOptions":[16]}]]]], options);
});
