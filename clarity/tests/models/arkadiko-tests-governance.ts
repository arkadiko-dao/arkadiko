import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import * as Utils from './arkadiko-tests-utils.ts';

// ---------------------------------------------------------
// Governance
// ---------------------------------------------------------

class Governance {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getAllProposals() {
    return this.chain.callReadOnlyFn("arkadiko-governance-v4-3", "get-proposals", [], this.deployer.address);
  }

  getAllProposalIDs() {
    return this.chain.callReadOnlyFn("arkadiko-governance-v4-3", "get-proposal-ids", [], this.deployer.address);
  }

  getProposalByID(id: number) {
    return this.chain.callReadOnlyFn("arkadiko-governance-v4-3", "get-proposal-by-id", [types.uint(id)], this.deployer.address)
  }

  getMemberVotes(id: number, member: Account) {
    return this.chain.callReadOnlyFn("arkadiko-governance-v4-3", "get-votes-by-member-by-id", [
      types.uint(id), 
      types.principal(member.address)
    ], this.deployer.address);
  }

  getMemberVoteTokens(id: number, member: Account, token: string = "arkadiko-token") {
    return this.chain.callReadOnlyFn("arkadiko-governance-v4-3", "get-tokens-by-member-by-id", [
      types.uint(id), 
      types.principal(member.address),
      types.principal(Utils.qualifiedName(token)),
    ], this.deployer.address);
  }

  static contractChange(name: string, qualifiedName: string, canMint: boolean, canBurn: boolean) {
    let address = qualifiedName.split(".")[0];
    return types.tuple({
      name: types.ascii(name),
      'address': types.principal(address),
      'qualified-name': types.principal(qualifiedName),
      'can-mint': types.bool(canMint),
      'can-burn': types.bool(canBurn)
    })
  }

  createProposal(user: Account, startBlock: number, title: string, url: string, contractChanges: string[], voteLength: number = 250) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "propose", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.uint(startBlock),
        types.uint(voteLength),
        types.utf8(title),
        types.utf8(url),        
        types.list(contractChanges)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  createProposalDao(user: Account, startBlock: number, title: string, url: string, contractChanges: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "propose-dao", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.uint(startBlock),
        types.utf8(title),
        types.utf8(url),        
        types.list(contractChanges)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  voteForProposal(user: Account, proposal: number, amount: number, token: string = "arkadiko-token") {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "vote-for", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(proposal),
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  voteAgainstProposal(user: Account, proposal: number, amount: number, token: string = "arkadiko-token") {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "vote-against", [
        types.principal(Utils.qualifiedName('arkadiko-stake-pool-diko-v2-1')),
        types.principal(Utils.qualifiedName(token)),
        types.uint(proposal),
        types.uint(amount * 1000000)
      ], user.address)
    ]);
    return block.receipts[0].result;
  }

  endProposal(proposal: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "end-proposal", [
        types.uint(proposal)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  returnVotes(proposal: number, user: Account, token: string = "arkadiko-token") {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "return-votes-to-member", [
        types.principal(Utils.qualifiedName(token)),
        types.uint(proposal),
        types.principal(user.address)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  toggleShutdown() {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "toggle-governance-shutdown", [], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  addNewContract(name: string, canMint: boolean = true, canBurn: boolean = true) {
    let block = this.chain.mineBlock([
      Tx.contractCall("arkadiko-governance-v4-3", "add-contract-address", [
        types.ascii(name),
        types.principal(this.deployer.address),
        types.principal(Utils.qualifiedName(name)),
        types.bool(canMint),
        types.bool(canBurn)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

}
export { Governance };


// ---------------------------------------------------------
// DAO
// ---------------------------------------------------------

class Dao {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getContractAddressByName(name: string) {
    return this.chain.callReadOnlyFn("arkadiko-dao", "get-contract-address-by-name", [types.ascii(name)], this.deployer.address);
  }

  getQualifiedNameByName(name: string) {
    return this.chain.callReadOnlyFn("arkadiko-dao", "get-qualified-name-by-name", [types.ascii(name)], this.deployer.address);
  }

  getContractCanMint(qualifiedName: string) {
    return this.chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-mint-by-qualified-name", [types.principal(Utils.qualifiedName(qualifiedName))], this.deployer.address);
  }

  getContractCanBurn(qualifiedName: string) {
    return this.chain.callReadOnlyFn("arkadiko-dao", "get-contract-can-burn-by-qualified-name", [types.principal(Utils.qualifiedName(qualifiedName))], this.deployer.address);
  }

}
export { Dao };
