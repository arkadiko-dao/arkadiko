import {
  buildDevnetNetworkOrchestrator,
  getBitcoinBlockHeight,
  getNetworkIdFromEnv,
} from "./helpers";
import {
  broadcastStackSTX,
  waitForNextPreparePhase,
  waitForNextRewardPhase,
  getPoxInfo,
  waitForRewardCycleId,
} from "./helpers";
import { Accounts } from "./constants";
import { StacksTestnet } from "@stacks/network";
import { DevnetNetworkOrchestrator } from "@hirosystems/stacks-devnet-js";

describe("testing stacking under epoch 2.1", () => {
  let orchestrator: DevnetNetworkOrchestrator;
  let timeline = {
    epoch_2_0: 100,
    epoch_2_05: 101,
    epoch_2_1: 103,
    pox_2_activation: 110,
  };

  beforeAll(() => {
    console.log('network ID:', getNetworkIdFromEnv());
    orchestrator = buildDevnetNetworkOrchestrator(getNetworkIdFromEnv());
    orchestrator.start();
  });

  afterAll(() => {
    orchestrator.terminate();
  });

  it("submitting stacks-stx through pox-1 contract during epoch 2.0 should succeed", async () => {
    const network = new StacksTestnet({ url: orchestrator.getStacksNodeUrl() });

    // Wait for Stacks genesis block
    await orchestrator.waitForNextStacksBlock();

    // Wait for block N-2 where N is the height of the next prepare phase
    let blockHeight = timeline.pox_2_activation + 1;
    let chainUpdate =
      await orchestrator.waitForStacksBlockAnchoredOnBitcoinBlockOfHeight(
        blockHeight
      );

    // Broadcast some STX stacking orders
    let fee = 1000;
    let cycles = 1;
    let response = await broadcastStackSTX(
      2,
      network,
      25_000_000_000_000,
      Accounts.WALLET_1,
      blockHeight,
      cycles,
      fee,
      0
    );
    // @ts-ignore
    expect(response.error).toBeUndefined();

    response = await broadcastStackSTX(
      2,
      network,
      50_000_000_000_000,
      Accounts.WALLET_2,
      blockHeight,
      cycles,
      fee,
      0
    );
    // @ts-ignore
    expect(response.error).toBeUndefined();

    response = await broadcastStackSTX(
      2,
      network,
      75_000_000_000_000,
      Accounts.WALLET_3,
      blockHeight,
      cycles,
      fee,
      0
    );
    // @ts-ignore
    expect(response.error).toBeUndefined();

    // Wait for block N+1 where N is the height of the next reward phase
    chainUpdate = await waitForNextRewardPhase(network, orchestrator, 1);
    let poxInfo = await getPoxInfo(network);

    // Assert
    expect(poxInfo.contract_id).toBe("ST000000000000000000002AMW42H.pox-2");
    expect(poxInfo.current_cycle.is_pox_active).toBe(true);
  });
});
