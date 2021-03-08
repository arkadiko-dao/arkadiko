import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Home } from './home';
import { Governance } from './governance';
import { NewVault } from './new-vault';

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
      <Route exact path="/governance" component={Governance} />
      <Route exact path="/vaults/new" component={NewVault} />
      <Redirect to="/" />
    </Switch>
  );
}
