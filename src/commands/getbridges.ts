import { EthAddress } from "@aztec/sdk";
import { BaseCommand } from "../base";
import { DataProviderWrapper } from "@aztec/bridge-clients/client-dest/src/client/aztec/data-provider/DataProvider";

export default class GetFees extends BaseCommand {
  static description = "Get the bridges on the current network";

  static examples = ["aztec-cli getbridges"];

  static flags = {
    ...BaseCommand.flags,
  };

  public async run(): Promise<void> {
    const testnetAddress = EthAddress.fromString(
      "0x525b43be6c67d10c73ca06d790b329820a1967b7" // address of the data provider
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
