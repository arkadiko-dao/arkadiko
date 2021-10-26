import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';


export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Redirect to="/" />
    </Switch>
  );
}
