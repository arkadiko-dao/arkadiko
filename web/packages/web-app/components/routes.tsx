import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Home } from './home';
import { Auctions } from './auctions';
import { Governance } from './governance';
import { NewVault } from './new-vault';
import { ManageVault } from './manage-vault';

export const routerConfig = [
  {
    path: '/',
    component: Home,
  }
];

export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/vaults" component={Home} />
      <Route exact path="/auctions" component={Auctions} />
      <Route exact path="/governance" component={Governance} />
      <Route exact path="/vaults/new" component={NewVault} />
      <Route path="/vaults/:id" component={ManageVault} />
      <Redirect to="/" />
    </Switch>
  );
}
