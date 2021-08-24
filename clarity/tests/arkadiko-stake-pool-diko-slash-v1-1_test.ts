import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  StakeRegistry
} from './models/arkadiko-tests-stake.ts';

import { 
  Governance
} from "./models/arkadiko-tests-governance.ts";

import { 
  DikoToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
name: "diko-slash: execute slash through governance",
async fn(chain: Chain, accounts: Map<string, Account>) {
  let deployer = accounts.get("deployer")!;
  let wallet_1 = accounts.get("wallet_1")!;
  let wallet_2 = accounts.get("wallet_2")!;

  let stakeRegistry = new StakeRegistry(chain, deployer);
  let governance = new Governance(chain, deployer);
  let dikoToken = new DikoToken(chain, deployer);

  // Add funds to DIKO pool first (100 DIKO)
  let result = stakeRegistry.stake(
    wallet_1, 
    'arkadiko-stake-pool-diko-v1-1',
    'arkadiko-token',
    100
  );
  result.expectOk().expectUintWithDecimals(100);

  // Create proposal
  let contractChange = Governance.contractChange("diko-slash", Utils.qualifiedName('arkadiko-stake-pool-diko-slash-v1-1'), true, true);
  result = governance.createProposal(
    wallet_1, 
    1, 
    "Black swan event slash",
    "ttps://discuss.arkadiko.finance/blackswan1",
    [contractChange]
  );
  result.expectOk().expectBool(true);

  // Vote for wallet_1
  result = governance.voteForProposal(wallet_1, 1, 10);
  result.expectOk().expectUint(3200);

  // Advance
  chain.mineEmptyBlock(1500);

  // End proposal
  result = governance.endProposal(1);
  result.expectOk().expectUint(3200);

  // Check if proposal updated
  let call:any = governance.getProposalByID(1);
  call.result.expectTuple()["is-open"].expectBool(false);

  // Check total DIKO pool balance (as rewards have auto compounded)
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(162.639906);

  // Now that the contract is active in the DAO, we can execute it
  // 30% of 162 DIKO = ~48
  let block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-slash-v1-1", "execute", [], wallet_1.address)
  ]);
  block.receipts[0].result.expectOk().expectUintWithDecimals(48.791971);

  // Foundation (still deployer in this case) should have received the funds
  call = dikoToken.balanceOf(deployer.address);
  call.result.expectOk().expectUintWithDecimals(890048.791971);

  // Check total DIKO pool balance
  // 70% of 162 DIKO = ~113
  call = dikoToken.balanceOf(Utils.qualifiedName('arkadiko-stake-pool-diko-v1-1'));
  call.result.expectOk().expectUintWithDecimals(113.847935);

  // Can not execute slash again
  block = chain.mineBlock([
    Tx.contractCall("arkadiko-stake-pool-diko-slash-v1-1", "execute", [], wallet_1.address)
  ]);
  block.receipts[0].result.expectErr().expectUint(404);
}
});
