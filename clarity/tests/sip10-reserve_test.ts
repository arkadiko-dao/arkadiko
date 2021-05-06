import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
import { assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name:
    "sip10-reserve: mint 5 dollar in stablecoin from 20000000 uDIKO at $2/DIKO through collateralize-and-mint",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Initial supply of xUSD should be 30
    let call = chain.callReadOnlyFn(
      "xusd-token",
      "get-total-supply",
      [],
      wallet_1.address,
    );
    let xusdInitialSupply = call.result
      .expectOk()
      .expectUint(1000000030);

    // Update price of DIKO, Create a new vault
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(20000000),
        types.uint(5000000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(200);
    block.receipts[1].result
      .expectOk()
      .expectUint(5000000);

    let [dikoTransferEvent, xusdMintEvent, vaultNotifEvent] =
      block.receipts[1].events;
    // Ensure that 20000000 units from .arkadiko-token::diko where successfully transfered from wallet_1 to .sip10-reserve
    dikoTransferEvent.ft_transfer_event.sender
      .expectPrincipal(deployer.address);
    dikoTransferEvent.ft_transfer_event.recipient
      .expectPrincipal(
        "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
      );
    dikoTransferEvent.ft_transfer_event.amount
      .expectInt(20000000);
    assert(
      dikoTransferEvent.ft_transfer_event.asset_identifier.endsWith(
        ".arkadiko-token::diko",
      ),
    );

    // Ensure that 5000000 units from .xusd-token::xusd where successfully minted for wallet_1
    xusdMintEvent.ft_mint_event.recipient
      .expectPrincipal(deployer.address);
    xusdMintEvent.ft_mint_event.amount
      .expectInt(5000000);
    assert(
      xusdMintEvent.ft_mint_event.asset_identifier.endsWith(
        ".xusd-token::xusd",
      ),
    );

    // Ensure that 1 vault was created
    let vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    let vault = vaultEvent["data"].expectTuple();
    vault["collateral"].expectUint(20000000);
    vault["debt"].expectUint(5000000);
    vault["collateral-token"].expectAscii("DIKO");
    vault["collateral-type"].expectAscii("DIKO-A");
    vault["owner"].expectPrincipal(deployer.address);

    // Ensure that the xUSD total supply increased
    call = chain.callReadOnlyFn(
      "xusd-token",
      "get-total-supply",
      [],
      wallet_1.address,
    );
    call.result
      .expectOk()
      .expectUint(xusdInitialSupply + 5000000);
  },
});

Clarinet.test({
  name: "sip10-reserve: should deposit extra collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price of DIKO, Create a new vault
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(20000000),
        types.uint(5000000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(200);
    block.receipts[1].result
      .expectOk()
      .expectUint(5000000);

    var [_e1, _e2, vaultNotifEvent] = block.receipts[1].events;

    // Ensure that 1 vault was created
    var vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    var vault = vaultEvent["data"].expectTuple();
    var vauldId = vault["id"].expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "deposit", [
        types.uint(vauldId),
        types.uint(20000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    var [dikoTransferEvent, dikoMintEvent, vaultNotifEvent] = block.receipts[0].events;
    // Ensure that 20000000 units from .arkadiko-token::diko where successfully transfered from wallet_1 to .sip10-reserve
    dikoTransferEvent.ft_transfer_event.sender
      .expectPrincipal(deployer.address);
    dikoTransferEvent.ft_transfer_event.recipient
      .expectPrincipal(
        "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
      );
    dikoTransferEvent.ft_transfer_event.amount
      .expectInt(20000000);
    assert(
      dikoTransferEvent.ft_transfer_event.asset_identifier.endsWith(
        ".arkadiko-token::diko",
      ),
    );

    // Ensure that 1 vault was update with a 40000000 collateral
    vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    vault = vaultEvent["data"].expectTuple();

    vault["collateral"].expectUint(40000000);
    vault["debt"].expectUint(5000000);
  },
});

Clarinet.test({
  name: "sip10-reserve: should withdraw collateral",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price of DIKO, Create a new vault
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(20000000),
        types.uint(5000000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(200);
    block.receipts[1].result
      .expectOk()
      .expectUint(5000000);

    var [_e1, _e2, vaultNotifEvent] = block.receipts[1].events;

    // Ensure that 1 vault was created
    var vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    var vault = vaultEvent["data"].expectTuple();
    var vauldId = vault["id"].expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "deposit", [
        types.uint(vauldId),
        types.uint(20000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "withdraw", [
        types.uint(vauldId),
        types.uint(5000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    var [dikoTransferEvent, dikoMintEvent, vaultNotifEvent] = block.receipts[0].events;
    // Ensure that 20_000_000 units from .arkadiko-token::diko where successfully transfered from wallet_1 to .sip10-reserve
    dikoTransferEvent.ft_transfer_event.sender
      .expectPrincipal(
        "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
      );
    dikoTransferEvent.ft_transfer_event.recipient
      .expectPrincipal(
        deployer.address,
      );

    // Ensure that 1 vault was update with a 35000000 collateral
    vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    vault = vaultEvent["data"].expectTuple();
    vault["collateral"].expectUint(35000000);
    vault["debt"].expectUint(5000000);
  },
});

Clarinet.test({
  name: "sip10-reserve: should mint xUSD",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price of DIKO, Create a new vault
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(20000000),
        types.uint(5000000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(200);
    block.receipts[1].result
      .expectOk()
      .expectUint(5000000);

    var [_e1, _e2, vaultNotifEvent] = block.receipts[1].events;

    // Ensure that 1 vault was created
    var vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    var vault = vaultEvent["data"].expectTuple();
    var vauldId = vault["id"].expectUint(1);

    let call = await chain.callReadOnlyFn("xusd-token", "get-balance-of", [
      types.principal(deployer.address),
    ], deployer.address);
    call.result.expectOk().expectUint(1005000000);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "mint", [
        types.uint(vauldId),
        types.uint(1000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
      ], deployer.address),
    ]);

    var [xUSDMintEvent, vaultNotifEvent] = block.receipts[0].events;
    // Ensure that 1_000_000 units from .xusd-token::xusd where successfully minted for wallet_1
    xUSDMintEvent.ft_mint_event.recipient
      .expectPrincipal(deployer.address);
    xUSDMintEvent.ft_mint_event.amount
      .expectInt(1000000);
    assert(
      xUSDMintEvent.ft_mint_event.asset_identifier.endsWith(
        ".xusd-token::xusd",
      ),
    );

    // Ensure that 1 vault was update with a 20000000 collateral
    vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    vault = vaultEvent["data"].expectTuple();
    vault["collateral"].expectUint(20000000);
    vault["debt"].expectUint(6000000);
  },
});

Clarinet.test({
  name: "sip10-reserve: should burn xUSD",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    // Update price of DIKO, Create a new vault
    let block = chain.mineBlock([
      Tx.contractCall("oracle", "update-price", [
        types.ascii("DIKO"),
        types.uint(200),
      ], deployer.address),
      Tx.contractCall("freddie", "collateralize-and-mint", [
        types.uint(20000000),
        types.uint(5000000),
        types.principal(deployer.address),
        types.ascii("DIKO-A"),
        types.ascii("DIKO"),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectUint(200);
    block.receipts[1].result
      .expectOk()
      .expectUint(5000000);

    var [_e1, _e2, vaultNotifEvent] = block.receipts[1].events;

    // Ensure that 1 vault was created
    var vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    var vault = vaultEvent["data"].expectTuple();
    var vauldId = vault["id"].expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "deposit", [
        types.uint(vauldId),
        types.uint(20000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
      Tx.contractCall("freddie", "withdraw", [
        types.uint(vauldId),
        types.uint(5000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    block.receipts[0].result
      .expectOk()
      .expectBool(true);
    block.receipts[1].result
      .expectOk()
      .expectBool(true);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "mint", [
        types.uint(vauldId),
        types.uint(1000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
      ], deployer.address),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectBool(true);

    var [xUSDMintEvent, vaultNotifEvent] = block.receipts[0].events;
    // Ensure that 1_000_000 units from .xusd-token::xusd where successfully minted for wallet_1
    xUSDMintEvent.ft_mint_event.recipient
      .expectPrincipal(deployer.address);
    xUSDMintEvent.ft_mint_event.amount
      .expectInt(1000000);
    assert(
      xUSDMintEvent.ft_mint_event.asset_identifier.endsWith(
        ".xusd-token::xusd",
      ),
    );

    // Ensure that 1 vault was update with a 40000000 collateral
    vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    vault = vaultEvent["data"].expectTuple();
    vault["collateral"].expectUint(35000000);
    vault["debt"].expectUint(6000000);

    block = chain.mineBlock([
      Tx.contractCall("freddie", "burn", [
        types.uint(vauldId),
        types.uint(6000000),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
        ),
        types.principal(
          "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.arkadiko-token",
        ),
      ], deployer.address),
    ]);

    var [_, xUSDBurnEvent, dikoTransferEvent, dikoMintEvent, vaultNotifEvent] = block.receipts[0].events;
    // Ensure that 6_000_000 units from .xusd-token::xusd where successfully burnt
    xUSDBurnEvent.ft_burn_event.sender
      .expectPrincipal(deployer.address);
    xUSDBurnEvent.ft_burn_event.amount
      .expectInt(6000000);
    assert(
      xUSDBurnEvent.ft_burn_event.asset_identifier.endsWith(
        ".xusd-token::xusd",
      ),
    );

    // Ensure that 35_000_000 units from .arkadiko-token::diko where successfully transfered from .sip10-reserve to wallet_1
    dikoTransferEvent.ft_transfer_event.sender
      .expectPrincipal(
        "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7.sip10-reserve",
      );
    dikoTransferEvent.ft_transfer_event.recipient
      .expectPrincipal(deployer.address);
    dikoTransferEvent.ft_transfer_event.amount
      .expectInt(35000000);
    assert(
      dikoTransferEvent.ft_transfer_event.asset_identifier.endsWith(
        ".arkadiko-token::diko",
      ),
    );

    // Ensure that the vault was emptied
    vaultEvent = vaultNotifEvent.contract_event.value.expectTuple();
    vault = vaultEvent["data"].expectTuple();
    vault["collateral"].expectUint(0);
    vault["debt"].expectUint(0);
  },
});
