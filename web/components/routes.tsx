import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Onboarding } from './onboarding/onboarding';
import { OnboardingStep1Swap } from './onboarding/step-1-swap';
import { OnboardingStep2Vaults } from './onboarding/step-2-vaults';
import { OnboardingStep3Staking } from './onboarding/step-3-staking';
import { OnboardingStep4Governance } from './onboarding/step-4-governance';
import { OnboardingEnd } from './onboarding/end';
import { Home } from './home';
import { Swap } from './swap';
import { Pool } from './pool';
import { AddSwapLiquidity } from './add-swap-liquidity';
import { RemoveSwapLiquidity } from './remove-swap-liquidity';
import { Governance } from './governance';
import { NewVault } from './new-vault';
import { ManageVault } from './manage-vault';
import { ViewProposal } from './view-proposal';
import { Stake } from './stake';
import { Liquidations } from './liquidations';
import { Redemptions } from './redemptions';
import { LegacyLiquidations } from './legacy-liquidations';
import { Admin } from './admin';

export const routerConfig = [
  {
    path: '/',
    component: Home,
  },
];

export function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Swap} />
      <Route exact path="/admin" component={Admin} />
      <Route exact path="/onboarding" component={Onboarding} />
      <Route exact path="/onboarding/step-1-swap" component={OnboardingStep1Swap} />
      <Route exact path="/onboarding/step-2-vaults" component={OnboardingStep2Vaults} />
      <Route exact path="/onboarding/step-3-staking" component={OnboardingStep3Staking} />
      <Route exact path="/onboarding/step-4-governance" component={OnboardingStep4Governance} />
      <Route exact path="/onboarding/end" component={OnboardingEnd} />
      <Route exact path="/vaults" component={Home} />
      <Route exact path="/swap" component={Swap} />
      <Route exact path="/swap/add/:currencyIdA/:currencyIdB" component={AddSwapLiquidity} />
      <Route exact path="/swap/remove/:currencyIdA/:currencyIdB" component={RemoveSwapLiquidity} />
      <Route exact path="/pool" component={Pool} />
      <Route exact path="/redemptions" component={Redemptions} />

      <Route exact path="/auctions" component={Liquidations} />
      <Route exact path="/liquidations" component={Liquidations} />
      <Route exact path="/legacy/liquidations" component={LegacyLiquidations} />
      <Route exact path="/governance" component={Governance} />
      <Route exact path="/stake" component={Stake} />
      <Route exact path="/vaults/new" component={NewVault} />
      <Route path="/vaults/:owner/:collateral" component={ManageVault} />
      <Route path="/governance/:version/:id" component={ViewProposal} />

      <Redirect to="/" />
    </Switch>
  );
}
