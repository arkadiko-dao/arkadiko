import {
  buildDevnetNetworkOrchestrator,
  DEFAULT_EPOCH_TIMELINE,
  getNetworkIdFromEnv,
  stackExtend,
  updatePrice,
} from "./helpers";
import {
  waitForNextRewardPhase,
  getPoxInfo,
  initiateStacking,
  createVault,
  getStackerInfo,
  stackIncrease,
  getTokensToStack,
  getNextStackerName
} from "./helpers";
import { Accounts } from "./constants";
import { StacksTestnet } from "@stacks/network";
import { DevnetNetworkOrchestrator } from "@hirosystems/stacks-devnet-js";

describe("testing stacking under epoch 2.1", () => {
  let orchestrator: DevnetNetworkOrchestrator;
  let timeline = DEFAULT_EPOCH_TIMELINE;

  beforeAll(() => {
    orchestrator = buildDevnetNetworkOrchestrator(getNetworkIdFromEnv());
    orchestrator.start(120000);
  });

  afterAll(() => {
    orchestrator.terminate();
  });

  it("test whole flow with initiate, increase stacking and extend stacking", async () => {
    const network = new StacksTestnet({ url: orchestrator.getStacksNodeUrl() });
    const fee = 1000;

    // Advance to make sure PoX-2 is activated
    await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(timeline.pox_2_activation + 1, 5, true);

    // PoX info
    let poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(3);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(0);

    // Set STX price to $2
    let response = await updatePrice(
      2,
      network,
      Accounts.DEPLOYER,
      fee,
      88
    );
    let blockResult = await orchestrator.waitForNextStacksBlock();
    let metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u2000000)");
    // console.log('Update price:', JSON.stringify(metadata, null, 2));

    // Create vault with 21M STX
    response = await createVault(
      21000000, // 21M stx
      10,
      network,
      Accounts.WALLET_1,
      fee,
      0
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u10000000)");

    // Initiate stacking
    let cycles = 1;
    response = await initiateStacking(
      network,
      Accounts.DEPLOYER,
      poxInfo.current_burnchain_block_height,
      cycles,
      fee,
      89
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u21000000000000)");

    // PoX info is now updated
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(3);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(21000000000000);

    // Create another vault
    // This vault is actually assigned to `stacker-2`
    // But it does not matter, as it's still possible to withraw this STX as `stacker`
    response = await createVault(
      200000, // 200k stx
      10000,
      network,
      Accounts.WALLET_2,
      fee,
      0
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u10000000000)");

    // Stacker name remains the same
    let nextStackerName = await getNextStackerName(network);
    expect(nextStackerName.value).toBe("stacker");

    // Tokens to stack updated
    let tokensToStack = await getTokensToStack(network, "stacker");
    expect(tokensToStack.value.value).toBe("21200000000000");

    // PoX still the same
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(3);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(21000000000000);

    // Advance until end of stacking
    let chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    
    // Get stacker info
    let info = await getStackerInfo(network);
    expect(info.value.locked.value).toBe("21000000000000");
    expect(info.value['unlock-height'].value).toBe("140");

    // Stack increase
    response = await stackIncrease(
      network,
      Accounts.DEPLOYER,
      'stacker',
      200000,
      fee,
      90
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u21200000000000)");

    // Stack extend
    response = await stackExtend(
      network,
      Accounts.DEPLOYER,
      fee,
      91
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[1].metadata;
    expect(response.error).toBeUndefined();
    expect((metadata as any)["success"]).toBe(true);
    expect((metadata as any)["result"]).toBe("(ok u150)");

    // Get stacker info
    info = await getStackerInfo(network);
    expect(info.value.locked.value).toBe("21200000000000");
    expect(info.value['unlock-height'].value).toBe("150");

    // Extra 200k added for next cycle
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(4);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(21200000000000);

    // Next cycle 0
    chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(5);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(0);

    // Current cycle 0
    chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.current_cycle.id).toBe(5);
    expect(poxInfo.current_cycle.stacked_ustx).toBe(0);

    // Get stacker info
    info = await getStackerInfo(network);
    expect(info.value.locked.value).toBe("0");
    expect(info.value['unlock-height'].value).toBe("0");
  });

});
