import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Home } from './home';
import { Governance } from './governance';

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
      <Redirect to="/" />
    </Switch>
  );
}
