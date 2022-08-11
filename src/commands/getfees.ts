import { AssetValue } from "@aztec/sdk";
import { Flags } from "../flags";
import { BaseCommand } from "../base";

export default class GetFees extends BaseCommand {
  static description = "Get the current tx fees";

  static examples = ["aztec-cli getfees"];

  static flags = {
    ...BaseCommand.flags,
    asset: Flags.asset({
      description: "The fee paying asset to fetch the fees for."
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse();

    const tokenAssetId = this.sdk!.getAssetIdBySymbol(flags.asset.toUpperCase());

    const depositFees = await this.sdk.getDepositFees(tokenAssetId)
    const withdrawFees = await this.sdk.getWithdrawFees(tokenAssetId)

    this.logFees("deposit", flags.asset, depositFees)
    this.logFees("withdraw", flags.asset, withdrawFees)

    await this.sdk.destroy()
  }

  public async logFees(action: string, asset: string, fees: AssetValue[]){
    this.log(action, "fees")
    this.log("============")
    fees.map((assetvalue, index)=>{
      let bigintfee = assetvalue.value / BigInt(10 ** 9)
      let fee = Number(bigintfee) / (10 ** 9)
      let speed
      if(index === 0) speed = "Next rollup"
      if(index === 1) speed = "Instant"
      this.log(speed, action ,"fee ", fee, asset)
    })
    this.log(" ")
  }
}
