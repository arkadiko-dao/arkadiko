import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Home } from './home';

export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Redirect to="/" />
    </Switch>
  );
}
