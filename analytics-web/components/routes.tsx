import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Home } from '@components/home';
import { Balances } from '@components/balances';

export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/balances" component={Balances} />
      <Redirect to="/" />
    </Switch>
  );
}
