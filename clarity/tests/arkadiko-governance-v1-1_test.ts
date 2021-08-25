import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.13.0/index.ts";

import { 
  Governance,
  Dao
} from "./models/arkadiko-tests-governance.ts";

import { 
  StakeRegistry,
  StakePoolDiko
} from './models/arkadiko-tests-stake.ts';

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;


Clarinet.test({
  name: "governance: add proposal and test proposal data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    // Get current proposals at start
    let call:any = governance.getAllProposalIDs();
    call.result.expectOk().expectList()[0].expectUint(0);
    
    call = governance.getProposalByID(0);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Create proposal
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      10, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // New proposal information 
    call = governance.getAllProposalIDs();
    call.result.expectOk().expectList();

    call = governance.getProposalByID(1);
    call.result.expectTuple()["title"].expectUtf8("Test Title");
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);
    call.result.expectTuple()["end-block-height"].expectUint(1450); // 10 + 1440

    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUint(0);
  }
});

Clarinet.test({
  name: "governance: add proposal with stDIKO balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Stake
    let result = stakeRegistry.stake(
      wallet_1, 
      'arkadiko-stake-pool-diko-v1-1',
      'arkadiko-token',
      150000
    );
    result.expectOk().expectUintWithDecimals(150000);

    // No DIKO left
    let call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUint(0);  

    // Got stDIKO
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(150000);  
 
    // Should be able to create poposal
    // No DIKO in wallet, but enough stDIKO
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('oracle'), true, true);
    result = governance.createProposal(
      wallet_1, 
      10, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

  }
});

Clarinet.test({
  name: "governance: vote on proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Should have no votes
    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 10);
    result.expectOk().expectUint(3200);

    // Check votes
    call = governance.getProposalByID(1);
    call.result.expectTuple()["yes-votes"].expectUintWithDecimals(10);
    call.result.expectTuple()["no-votes"].expectUint(0);

    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(10);

    call = governance.getMemberVotes(1, wallet_2);
    call.result.expectTuple()["vote-count"].expectUint(0);

    // Vote for wallet_2
    result = governance.voteForProposal(wallet_2, 1, 20);
    result.expectOk().expectUint(3200);

    // Vote against wallet_2
    result = governance.voteAgainstProposal(wallet_2, 1, 1);
    result.expectOk().expectUint(3200);

    // Check votes
    call = governance.getProposalByID(1);
    call.result.expectTuple()["yes-votes"].expectUintWithDecimals(30);
    call.result.expectTuple()["no-votes"].expectUintWithDecimals(1);

    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(10);

    call = governance.getMemberVotes(1, wallet_2);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(21);
  }
});

Clarinet.test({
  name: "governance: end proposal + execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    // Create proposal to start at block 1
    let contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let contractChange2 = Governance.contractChange("freddie", Utils.qualifiedName('new-freddie'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1, contractChange2]
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

    // Check if DAO updated
    call = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-oracle'));

    call = dao.getContractAddressByName("freddie");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("freddie");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-freddie'));
  }
});

Clarinet.test({
  name: "governance: end proposal + do not execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 1000);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if proposal updated
    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(false);

    // DAO should not be updated
    call = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-oracle'));
  }
});

Clarinet.test({
  name: "governance: end proposal + return DIKO and stDIKO to voters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDiko(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    // Stake DIKO to get stDIKO 
    let result = stakeRegistry.stake(
      wallet_1, 
      'arkadiko-stake-pool-diko-v1-1',
      'arkadiko-token',
      100
    );
    result.expectOk().expectUintWithDecimals(100);

    // Advance 3 block, so that DIKO/stDIKO ratio is not 1 anymore
    chain.mineEmptyBlock(3);

    // Stake DIKO to get stDIKO again, at different rate
    result = stakeRegistry.stake(
      wallet_1, 
      'arkadiko-stake-pool-diko-v1-1',
      'arkadiko-token',
      100
    );
    result.expectOk().expectUintWithDecimals(24.201384); // 24

    // Total stDIKO balance for user is now ~124
    let call:any = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(124.201384);   

    // Total DIKO balance is 
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote with DIKO
    result = governance.voteForProposal(wallet_1, 1, 10, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // DIKO/stDIKO ratio
    call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(4.131995); // ~4

    // Vote with stDIKO - 10 stDIKO = ~40 DIKO
    result = governance.voteForProposal(wallet_1, 1, 10, "stdiko-token");
    result.expectOk().expectUint(3200);

    // Total votes from wallet: 10 DIKO + 10 stDIKO
    // Where the 10 stDIKO = ~40 DIKO
    // So total is ~50 votes
    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(51.319950);

    // stDIKO balance
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(114.201384);   

    // DIKO balance has decreased by 10
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149790);  

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Return DIKO to members
    result = governance.returnVotes(1, wallet_1, "arkadiko-token");
    result.expectOk();

    // Return stDIKO to members
    result = governance.returnVotes(1, wallet_1, "stdiko-token");
    result.expectOk();

    // Should have initial amount back
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(124.201384);   

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  

  }
});

Clarinet.test({
  name: "governance: cannot add proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    let result = governance.shutdown();
    result.expectOk().expectBool(true);

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectErr().expectUint(34);

  }
});

Clarinet.test({
  name: "governance: cannot vote for a proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      1, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    result = governance.shutdown();
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 100);
    result.expectErr().expectUint(34);
  }
});

Clarinet.test({
  name: "governance: add new contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let governance = new Governance(chain, deployer);

    let result = governance.addNewContract("amazing-stacker-that-lends");
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "governance: add new contract fails if it already exists",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let governance = new Governance(chain, deployer);

    let result = governance.addNewContract("stacker");
    result.expectOk().expectBool(false);
  }
});
