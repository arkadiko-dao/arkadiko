import {
  buildDevnetNetworkOrchestrator,
  DEFAULT_EPOCH_TIMELINE,
  getBitcoinBlockHeight,
  getNetworkIdFromEnv,
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
    let poxInfo = await getPoxInfo(network);
    const fee = 1000;
    await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(timeline.pox_2_activation + 1, 5, true);
    poxInfo = await getPoxInfo(network);

    let response = await createVault(
      200000, // 200k stx
      10000,
      network,
      Accounts.WALLET_1,
      fee,
      0
    );
    console.log('1', response);
    // @ts-ignore
    expect(response.error).toBeUndefined();

    let cycles = 1;
    response = await initiateStacking(
      network,
      Accounts.WALLET_1,
      poxInfo.current_burnchain_block_height,
      cycles,
      fee,
      1
    );
    console.log('2', response);
    // @ts-ignore
    expect(response.error).toBeUndefined();

    poxInfo = await getPoxInfo(network);
    console.log('3', poxInfo);

    response = await createVault(
      200000, // 200k stx
      10000,
      network,
      Accounts.WALLET_2,
      fee,
      0
    );
    console.log('4', response);
    // @ts-ignore
    expect(response.error).toBeUndefined();

    poxInfo = await getPoxInfo(network);
    console.log(poxInfo);

    // Advance until end of stacking
    await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(timeline.pox_2_activation + 1, 5, true);

    const info = await getStackerInfo(network);
    console.log('info:', info);

    let response2 = await stackIncrease(
      network,
      Accounts.DEPLOYER,
      'stacker-2',
      fee,
      0
    );
    console.log('5', response2);

    let chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    poxInfo = await getPoxInfo(network);
    console.log(poxInfo);
    console.log(chainUpdate);
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
