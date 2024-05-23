import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { 
  Governance,
  Dao
} from "./models/arkadiko-tests-governance.ts";

import { 
  StakeRegistry,
  StakePoolDikoV1
} from './models/arkadiko-tests-stake.ts';

import { 
  DikoToken,
  StDikoToken
} from './models/arkadiko-tests-tokens.ts';

import * as Utils from './models/arkadiko-tests-utils.ts'; Utils;

Clarinet.test({
  name: "governance: add proposal and check proposal data",
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
    let contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('oracle'), false, false);
    let contractChange2 = Governance.contractChange("freddie", Utils.qualifiedName('freddie'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      10, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1, contractChange2]
    );
    result.expectOk().expectBool(true);

    // New proposal info
    call = governance.getAllProposals();
    let proposal1 = call.result.expectOk().expectList()[1].expectTuple();
    proposal1["title"].expectUtf8("Test Title");
    proposal1["is-open"].expectBool(true);
    proposal1["start-block-height"].expectUint(10);
    proposal1["yes-votes"].expectUint(0);
    proposal1["no-votes"].expectUint(0);
    proposal1["end-block-height"].expectUint(730); // 10 + 720

    let change1 = proposal1["contract-changes"].expectList()[0].expectTuple();
    change1["name"].expectAscii("oracle");
    change1["address"].expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    change1["can-mint"].expectBool(false);
    change1["can-burn"].expectBool(false);

    let change2 = proposal1["contract-changes"].expectList()[1].expectTuple();
    change2["name"].expectAscii("freddie");
    change2["address"].expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
    change2["can-mint"].expectBool(true);
    change2["can-burn"].expectBool(true);

    // New proposal information 
    call = governance.getAllProposalIDs();
    call.result.expectOk().expectList();

    call = governance.getProposalByID(1);
    call.result.expectTuple()["title"].expectUtf8("Test Title");
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(10);
    call.result.expectTuple()["yes-votes"].expectUint(0);
    call.result.expectTuple()["no-votes"].expectUint(0);
    call.result.expectTuple()["end-block-height"].expectUint(730); // 10 + 1440

    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUint(0);
  }
});

Clarinet.test({
  name: "governance: add proposal as user with stDIKO only, no DIKO",
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
      'arkadiko-stake-pool-diko-v2-1',
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
  name: "governance: vote for and against a proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
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

    call = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUint(0);

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

    call = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(10);

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

    call = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(10);

    call = governance.getMemberVoteTokens(1, wallet_2, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(21);
  }
});

Clarinet.test({
  name: "governance: end proposal and execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 1
    let contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let contractChange2 = Governance.contractChange("freddie", Utils.qualifiedName('new-freddie'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1, contractChange2]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 100000);
    result.expectOk().expectUint(3200);

    // Vote for wallet_2
    result = governance.voteForProposal(wallet_2, 1, 100000);
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
  name: "governance: proposal as DAO with short vote length",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 1
    // Vote length of 10 blocks
    // But min vote length is 250 blocks
    let contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      deployer, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1],
      10
    );
    result.expectOk().expectBool(true);

    // Check if proposal updated
    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(true);
    call.result.expectTuple()["start-block-height"].expectUint(106);
    call.result.expectTuple()["end-block-height"].expectUint(356);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 100000);
    result.expectOk().expectUint(3200);

    // Vote for wallet_2
    result = governance.voteForProposal(wallet_2, 1, 100000);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(50);

    // Can not end yet, min vote length is 250 blocks
    result = governance.endProposal(1);
    result.expectErr().expectUint(35);

    // Advance
    chain.mineEmptyBlock(200);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if proposal updated
    call = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(false);

    // Check if DAO updated
    call = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-oracle'));
  }
});

Clarinet.test({
  name: "governance: use governance to replace governance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 1
    let contractChange1 = Governance.contractChange("governance", Utils.qualifiedName('arkadiko-governance-tv1-1'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Replace governance",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteForProposal(wallet_1, 1, 100000);
    result.expectOk().expectUint(3200);

    // Vote for wallet_2
    result = governance.voteForProposal(wallet_2, 1, 100000);
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
    call = dao.getContractAddressByName("governance");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("governance");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-governance-tv1-1'));

    contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-tv1-1", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.uint(chain.blockHeight),
        types.utf8("Replace Oracle"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),        
        types.list([contractChange1])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-tv1-1", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName('arkadiko-token')),
        types.uint(1),
        types.uint(10 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(251);

    // End proposal
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-tv1-1", "end-proposal", [
        types.uint(1)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3200);

    // Check if proposal updated
    call = chain.callReadOnlyFn("arkadiko-governance-tv1-1", "get-proposal-by-id", [types.uint(7)], deployer.address)
    call.result.expectTuple()["is-open"].expectBool(false);

    // Check if DAO updated
    call = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('new-oracle'));

    // Old governance still accepts proposals
    // So we need to shut down the old governance module
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.uint(2504),
        types.uint(123),
        types.utf8("Replace Oracle"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
        types.list([contractChange1])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.uint(2504),
        types.uint(123),
        types.utf8("Replace Oracle"),
        types.utf8("https://discuss.arkadiko.finance/my/very/long/url/path"),
        types.list([contractChange1])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(34);
  }
});

Clarinet.test({
  name: "governance: end proposal but do not execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote for wallet_1
    result = governance.voteAgainstProposal(wallet_1, 1, 100000);
    result.expectOk().expectUint(3200);

    // Vote for wallet_2
    result = governance.voteAgainstProposal(wallet_2, 1, 100000);
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
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-oracle-v2-3'));
  }
});

Clarinet.test({
  name: "governance: end proposal and return DIKO and stDIKO to voters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let stakeRegistry = new StakeRegistry(chain, deployer);
    let stakePoolDiko = new StakePoolDikoV1(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Stake DIKO to get stDIKO 
    let result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v2-1', 'arkadiko-token', 100);
    result.expectOk().expectUintWithDecimals(100);

    // Advance 3 blocks, so that DIKO/stDIKO ratio is not 1 anymore
    chain.mineEmptyBlock(2);

    // Stake DIKO to get stDIKO again, at different rate
    result = stakeRegistry.stake(wallet_1, 'arkadiko-stake-pool-diko-v2-1', 'arkadiko-token', 100);
    result.expectOk().expectUintWithDecimals(1.443470);

    // Total stDIKO balance for user is now ~101
    let call:any = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(101.443470);   

    // Total DIKO balance is 
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  

    // Create proposal to start at block 1
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    result = governance.createProposal(
      wallet_1, 
      chain.blockHeight, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote with DIKO
    result = governance.voteForProposal(wallet_1, 1, 10, "arkadiko-token");
    result.expectOk().expectUint(3200);
    result = governance.voteAgainstProposal(wallet_1, 1, 1, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // DIKO/stDIKO ratio = ~70
    call = stakePoolDiko.getDikoStdikoRatio();
    call.result.expectOk().expectUintWithDecimals(69.277497);

    // Vote with stDIKO - 10 stDIKO = ~40 DIKO
    result = governance.voteForProposal(wallet_1, 1, 10, "stdiko-token");
    result.expectOk().expectUint(3200);
    result = governance.voteAgainstProposal(wallet_1, 1, 1, "stdiko-token");
    result.expectOk().expectUint(3200);

    // Total votes from wallet: 11 DIKO + 11 stDIKO
    // Where the 1 stDIKO = ~70 DIKO
    // So total is ~773 votes
    call = governance.getMemberVotes(1, wallet_1);
    call.result.expectTuple()["vote-count"].expectUintWithDecimals(773.052467);

    // stDIKO balance has decreased by 11
    call = stDikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(90.443470);   

    // DIKO balance has decreased by 11
    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149789);  

    // Tokens used to vote
    call = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(11);
    call = governance.getMemberVoteTokens(1, wallet_1, "stdiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(11);

    result = governance.voteForProposal(wallet_2, 1, 15000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

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
    call.result.expectOk().expectUintWithDecimals(101.443470);   

    call = dikoToken.balanceOf(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(149800);  

    // Tokens used to vote
    call = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call = governance.getMemberVoteTokens(1, wallet_1, "stdiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "governance: should only be able to return tokens once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Create proposal to start at block 6
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote with DIKO
    result = governance.voteForProposal(wallet_1, 1, 10, "arkadiko-token");
    result.expectOk().expectUint(3200);
    result = governance.voteForProposal(wallet_2, 1, 100, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // Tokens used to vote
    let call:any = governance.getMemberVoteTokens(1, wallet_1, "arkadiko-token");
    call.result.expectTuple()["amount"].expectUintWithDecimals(10);

    // Advance
    chain.mineEmptyBlock(715);

    result = governance.voteForProposal(wallet_2, 1, 15000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    chain.mineEmptyBlock(1);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Return DIKO to members
    result = governance.returnVotes(1, wallet_1, "arkadiko-token");
    result.expectOk();

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "return-votes-to-member", [
        types.principal(Utils.qualifiedName("arkadiko-token")),
        types.uint(1),
        types.principal(wallet_1.address)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(3); // Amount is 0

  }
});

Clarinet.test({
  name: "governance: should be able to replace governance itself",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // New proposal
    let contractChange = Governance.contractChange("governance", Utils.qualifiedName('arkadiko-governance-tv1-1'), false, false);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote for proposal
    result = governance.voteForProposal(wallet_1, 1, 10);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(wallet_2, 1, 15000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(1500);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if DAO updated
    let call = dao.getContractAddressByName("governance");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("governance");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-governance-tv1-1'));

    // Should not be able to execute proposal through old governance
    contractChange = Governance.contractChange("oracle", Utils.qualifiedName('malicious-oracle'), false, false);
    result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 2, 10);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(wallet_2, 2, 15000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 2, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    chain.mineEmptyBlock(1500);

    result = governance.endProposal(2);
    result.expectOk().expectUint(3200);

    // DAO is not updated
    call = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-oracle-v2-3'));
  }
});

Clarinet.test({
  name: "governance: should not be able to add proposal in the past",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Advance
    chain.mineEmptyBlock(2000);

    // New proposal
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('malicious-oracle'), false, false);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight - 2,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectErr().expectUint(36);

  }
});

Clarinet.test({
  name: "governance: should not be able to execute proposal twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // New proposal
    let contractChange = Governance.contractChange("governance", Utils.qualifiedName('arkadiko-governance-tv1-1'), false, false);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Vote for proposal
    result = governance.voteForProposal(wallet_1, 1, 10);
    result.expectOk().expectUint(3200);

    // Advance
    chain.mineEmptyBlock(715);

    result = governance.voteForProposal(wallet_2, 1, 15000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    chain.mineEmptyBlock(7);

    // End proposal
    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Check if DAO updated
    let call = dao.getContractAddressByName("governance");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("governance");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-governance-tv1-1'));

    // Can not execute proposal again
    result = governance.endProposal(1);
    result.expectErr().expectUint(3401);
  }
});

Clarinet.test({
  name: "governance: can not propose vote if not enough DIKO/stDIKO balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let governance = new Governance(chain, deployer);
    let dikoToken = new DikoToken(chain, deployer);
    let stDikoToken = new StDikoToken(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    // Total liquid supply = 3.047.975
    // User has 150.000
    let call = dikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(150000);
    call = stDikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Burn so wallet_2 has 0.25%
    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-token", "burn", [
        types.uint(142380 * 1000000),
        types.principal(wallet_2.address)
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = dikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(7620);
    call = stDikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Can create proposal 
    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_2, 
      chain.blockHeight, 
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Burn so wallet_2 has less than 0.25%
    block = chain.mineBlock([
      Tx.contractCall("arkadiko-token", "burn", [
        types.uint(1 * 1000000),
        types.principal(wallet_2.address)
      ], wallet_2.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = dikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(7619);
    call = stDikoToken.balanceOf(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Can not create proposal
    let contractChange2 = Governance.contractChange("freddie", Utils.qualifiedName('freddie'), true, true);
    result = governance.createProposal(
      wallet_2, 
      chain.blockHeight, 
      "Test Title 2",
      "https://discuss.arkadiko.finance/my/very/long/url/path2",
      [contractChange2]
    );
    result.expectErr().expectUint(31);
  }
});

// ---------------------------------------------------------
// Emergency switch
// ---------------------------------------------------------

Clarinet.test({
  name: "governance: cannot add proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    let result = governance.toggleShutdown();
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

    chain.mineEmptyBlockUntil(100);

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    // Turn emergency switch on
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 100);
    result.expectErr().expectUint(34);

    // Turn emergency switch off
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 100);
    result.expectOk().expectUint(3200);
  }
});

Clarinet.test({
  name: "governance: cannot execute a proposal when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 10000);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    // Turn emergency switch on
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(1500);

    result = governance.endProposal(1);
    result.expectErr().expectUint(34);

    // Turn emergency switch off
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);
  }
});

Clarinet.test({
  name: "governance: cannot return votes when emergency switch is on",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let governance = new Governance(chain, deployer);

    chain.mineEmptyBlockUntil(100);

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 10000);
    result.expectOk().expectUint(3200);

    result = governance.voteForProposal(deployer, 1, 150000, "arkadiko-token");
    result.expectOk().expectUint(3200);

    chain.mineEmptyBlock(1500);

    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);

    // Turn emergency switch on
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    result = governance.returnVotes(1, wallet_1, "arkadiko-token");
    result.expectErr().expectUint(34);

    // Turn emergency switch off
    result = governance.toggleShutdown();
    result.expectOk().expectBool(true);

    result = governance.returnVotes(1, wallet_1, "arkadiko-token");
    result.expectOk().expectBool(true);
  }
});

// ---------------------------------------------------------
// Add new contract
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// Access rights
// ---------------------------------------------------------

Clarinet.test({
  name: "governance: only DAO owner can toggle emergency switch",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "toggle-governance-shutdown", [], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(3401);
  }
});

Clarinet.test({
  name: "governance: only DAO owner can add new contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "add-contract-address", [
        types.ascii("malicious-contract"),
        types.principal(wallet_1.address),
        types.principal(Utils.qualifiedName("malicious-contract")),
        types.bool(true),
        types.bool(true)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(3401);
  }
});

Clarinet.test({
  name: "governance: only DAO owner can set vote length on proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    chain.mineEmptyBlockUntil(100);

    let governance = new Governance(chain, deployer);

    // Create proposal to start at block 1
    // Vote length of 10 blocks
    let contractChange1 = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposalDao(
      wallet_1, 
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange1]
    );
    result.expectOk().expectBool(true);

    // End block has still taken 720 blocks (~5 days) into account
    let call:any = governance.getProposalByID(1);
    call.result.expectTuple()["end-block-height"].expectUint(826);

  }
});

Clarinet.test({
  name: "governance: vote fails when participation is smaller than 5%",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    chain.mineEmptyBlockUntil(100);

    let governance = new Governance(chain, deployer);
    let dao = new Dao(chain, deployer);

    let call:any = dao.getContractAddressByName("oracle");
    call.result.expectSome().expectPrincipal(deployer.address);
    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-oracle-v2-3'));

    let contractChange = Governance.contractChange("oracle", Utils.qualifiedName('new-oracle'), true, true);
    let result = governance.createProposal(
      wallet_1,
      chain.blockHeight,
      "Test Title",
      "https://discuss.arkadiko.finance/my/very/long/url/path",
      [contractChange]
    );
    result.expectOk().expectBool(true);

    result = governance.voteForProposal(wallet_1, 1, 10000);
    result.expectOk().expectUint(3200);

    chain.mineEmptyBlock(1500);

    result = governance.endProposal(1);
    result.expectOk().expectUint(3200);
    call = governance.getProposalByID(1);
    call.result.expectTuple()["is-open"].expectBool(false);

    call = dao.getQualifiedNameByName("oracle");
    call.result.expectSome().expectPrincipal(Utils.qualifiedName('arkadiko-oracle-v2-3'));
  }
});
