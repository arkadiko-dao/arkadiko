import { describe } from "mocha";
import { deployContract } from "./utils";

describe("arkadiko deploys suite", () => {
  it("deploys", async () => {
    await deployContract("arkadiko-token");
    await deployContract("oracle");
    await deployContract("stx-reserve");
  });
});
