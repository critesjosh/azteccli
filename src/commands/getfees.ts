import { AssetValue } from "@aztec/sdk";
import { Flags } from "../flags.js";
import { BaseCommand } from "../base.js";

export default class GetFees extends BaseCommand {
  static description = "Get the current tx fees";

  static examples = ["aztec-cli getfees"];

  static flags = {
    ...BaseCommand.flags,
    asset: Flags.asset({
      description: "The fee paying asset to fetch the fees for.",
    }),
  };

  public async run(): Promise<void> {
    const tokenAssetId = this.sdk!.getAssetIdBySymbol(
      this.flags.asset.toUpperCase()
    );

    const depositFees = await this.sdk.getDepositFees(tokenAssetId);
    const withdrawFees = await this.sdk.getWithdrawFees(tokenAssetId);

    this.logFees("deposit", this.flags.asset, depositFees);
    this.logFees("withdraw", this.flags.asset, withdrawFees);
  }

  public async logFees(action: string, asset: string, fees: AssetValue[]) {
    this.log(action, "fees");
    this.log("============");
    fees.map((assetvalue, index) => {
      let bigintfee = assetvalue.value / BigInt(10 ** 9);
      let fee = Number(bigintfee) / 10 ** 9;
      let speed;
      if (index === 0) speed = "Next rollup";
      if (index === 1) speed = "Instant";
      this.log(speed, action, "fee ", fee, asset);
    });
    this.log(" ");
  }
}
