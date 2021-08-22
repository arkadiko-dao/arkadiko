import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Home } from './home';
import { Swap } from './swap';
import { AddSwapLiquidity } from './add-swap-liquidity';
import { RemoveSwapLiquidity } from './remove-swap-liquidity';
import { Auctions } from './auctions';
import { Governance } from './governance';
import { NewVault } from './new-vault';
import { ManageVault } from './manage-vault';
import { ViewProposal } from './view-proposal';
import { Stake } from './stake';
import { Balances } from './balances';
import { Onboarding } from './onboarding';

export const routerConfig = [
  {
    path: '/',
    component: Home,
  }
];

export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Swap} />
      <Route exact path="/onboarding" component={Onboarding} />
      <Route exact path="/vaults" component={Home} />
      <Route exact path="/swap" component={Swap} />
      <Route exact path="/swap/add/:currencyIdA/:currencyIdB" component={AddSwapLiquidity} />
      <Route exact path="/swap/remove/:currencyIdA/:currencyIdB" component={RemoveSwapLiquidity} />

      <Route exact path="/auctions" component={Auctions} />
      <Route exact path="/governance" component={Governance} />
      <Route exact path="/stake" component={Stake} />
      <Route exact path="/vaults/new" component={NewVault} />
      <Route exact path="/balances" component={Balances} />
      <Route path="/vaults/:id" component={ManageVault} />
      <Route path="/governance/:id" component={ViewProposal} />
      <Redirect to="/" />
    </Switch>
  );
}
