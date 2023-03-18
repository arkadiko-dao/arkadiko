import {
  buildDevnetNetworkOrchestrator,
  DEFAULT_EPOCH_TIMELINE,
  getBitcoinBlockHeight,
  getNetworkIdFromEnv,
  getTokensToStack,
  updatePrice,
} from "./helpers";
import {
  broadcastStackSTX,
  waitForNextPreparePhase,
  waitForNextRewardPhase,
  getPoxInfo,
  waitForRewardCycleId,
  initiateStacking,
  createVault,
  getStackerInfo,
  stackIncrease
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
    console.log("POX - 1", poxInfo);
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
    console.log('vault 2:', JSON.stringify(metadata, null, 2));

    // PoX still the same
    poxInfo = await getPoxInfo(network);
    expect(poxInfo.next_cycle.id).toBe(3);
    expect(poxInfo.next_cycle.stacked_ustx).toBe(21000000000000);

    // poxInfo = await getPoxInfo(network);
    // console.log(poxInfo);

    // Advance until end of stacking
    // await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(timeline.pox_2_activation + 1, 5, true);
    // let chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    // console.log('next phase:', JSON.stringify(chainUpdate, null, 2));


    poxInfo = await getPoxInfo(network);
    console.log('PoX 3', poxInfo);

    const info = await getStackerInfo(network);
    console.log('Stacker info: ', info);
    expect(info.value.locked.value).toBe("21000000000000");

    response = await stackIncrease(
      network,
      Accounts.DEPLOYER,
      'stacker',
      fee,
      90
    );
    blockResult = await orchestrator.waitForNextStacksBlock();
    metadata = blockResult.new_blocks[0].block.transactions[0].metadata;
    console.log('stack increase:', JSON.stringify(response, null, 2));
    expect(response.error).toBeUndefined();


    // console.log('Stack increase', response2);
    // console.log('Stack increase', JSON.stringify(blockResult, null, 2));

    let chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    poxInfo = await getPoxInfo(network);
    console.log("PoX info 4", poxInfo);
    // console.log("Chain update:", chainUpdate);
  });

//   it("submitting stacks-stx through pox-2 contract during epoch 2.0 should succeed", async () => {
//     const network = new StacksTestnet({ url: orchestrator.getStacksNodeUrl() });
//     let poxInfo = await getPoxInfo(network);
//     await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(timeline.pox_2_activation + 1, 5, true);
//     poxInfo = await getPoxInfo(network);

//     // Broadcast some STX stacking orders
//     let fee = 1000;
//     let cycles = 1;
//     let response = await broadcastStackSTX(
//       2,
//       network,
//       95_000_000_000_000,
//       Accounts.WALLET_1,
//       poxInfo.current_burnchain_block_height,
//       cycles,
//       fee,
//       0
//     );
//     // @ts-ignore
//     expect(response.error).toBeUndefined();

//     response = await broadcastStackSTX(
//       2,
//       network,
//       95_000_000_000_000,
//       Accounts.WALLET_2,
//       poxInfo.current_burnchain_block_height,
//       cycles,
//       fee,
//       0
//     );
//     // @ts-ignore
//     expect(response.error).toBeUndefined();

//     response = await broadcastStackSTX(
//       2,
//       network,
//       95_000_000_000_000,
//       Accounts.WALLET_3,
//       poxInfo.current_burnchain_block_height,
//       cycles,
//       fee,
//       0
//     );
//     // @ts-ignore
//     expect(response.error).toBeUndefined();

//     // Wait for block N+1 where N is the height of the next reward phase
    // let chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    // poxInfo = await getPoxInfo(network);
    // console.log(poxInfo);

//     // Assert
//     expect(poxInfo.contract_id).toBe("ST000000000000000000002AMW42H.pox-2");
//     expect(poxInfo.current_cycle.is_pox_active).toBe(true);
//   });
});
