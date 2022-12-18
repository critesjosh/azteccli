import { BaseCommand } from "../base.js";

export default class GetAssetDetails extends BaseCommand {
  static description =
    "Print the currently supported assets on Aztec and the associated token info.";

  static examples = ["aztec-cli getassetinfo"];

  static flags = {
    ...BaseCommand.flags,
  };

  public async run(): Promise<void> {
    let padding = 20;
    let status = await this.sdk.getRemoteStatus();
    status.blockchainStatus.assets.map((asset, i) => {
      this.log("=".padEnd(padding, "="));
      this.log("Asset:".padEnd(padding, " "), asset.name);
      this.log("Asset Symbol:".padEnd(padding, ' '), asset.symbol);
      this.log("Asset Id:".padEnd(padding, " "), i);
      this.log("Token address".padEnd(padding, " "), asset.address.toString());
      this.log("Decimals:".padEnd(padding, " "), asset.decimals);
    });
  }
}
