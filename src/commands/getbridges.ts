import { EthAddress } from "@aztec/sdk";
import { BaseCommand } from "../base.js";
import { DataProviderWrapper } from "../bridge-clients/client/aztec/data-provider/DataProvider.js";

export default class GetBridges extends BaseCommand {
  static description = "Get the bridges on the current network";

  static examples = ["aztec-cli getbridges"];

  static flags = {
    ...BaseCommand.flags,
  };

  public async run(): Promise<void> {
    const testnetAddress = EthAddress.fromString(
      "0x5b2989bc33f19bfac4bcaad4e1795e2501edd5a3" // address of the data provider
    );
    const dataProvider = DataProviderWrapper.create(
      this.ethereumProvider,
      testnetAddress as any
    );
    const bridges = await dataProvider.getBridges();
    for (const bridge in bridges) {
      const bridgeData = bridges[bridge];
      this.log(`Bridge: ${bridge}`);
      for (const [key, value] of Object.entries(bridgeData)) {
        this.log(`${key}: ${value}`);
      }
      this.log("===");
    }
  }
}
