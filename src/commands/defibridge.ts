import { AssetValue, BridgeCallData, EthAddress } from "@aztec/sdk";
import { BaseCommand } from "../base.js";
import { createElementAdaptor } from "../defiAdaptors/elementAdaptor.js";
import { createLidoAdaptor } from "../defiAdaptors/lidoAdaptor.js";
import { Flags } from "../flags.js";
import networkConfig from "../network_config.js";
import { parseTime } from "../utils.js";

export default class DefiBridge extends BaseCommand {
  static description = "Bridge assets to Ethereum base layer.";

  static flags = {
    ...BaseCommand.flags,
    time: Flags.defiTime,
    asset: Flags.asset(),
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    useAccountKeySigner: Flags.useAccountKeySigner,
    signingKey: Flags.signingKey,
    customSignerMessage: Flags.customSignerMessage,
    spendingKeyRequired: Flags.spendingKeyRequired,
  };

  static args = [{ name: "amount", required: true }];

  static examples = [];

  public async run(): Promise<void> {
    const { time, asset } = this.flags;
    const { amount } = this.args;
    let settlementTime = parseTime(time, true);
    let accountKeys = await this.getAccountKeysAndSyncAccount();
    const signer = await this.getSigner();

    const ethToWstEth = new BridgeCallData(5, 0, 2); // IN: ETH (0), OUT: wstETH (2)
    const WstEthToEth = new BridgeCallData(5, 2, 0); // IN: wstETH (2), OUT: ETH (0)
    
    const donationBridge = new BridgeCallData(14, 0, 0, undefined, undefined, BigInt(1));

    let bridge = donationBridge;

    const tokenAssetId = this.sdk!.getAssetIdBySymbol(asset.toUpperCase());
    const tokenQuantity = BigInt((amount as number) * 10 ** 18);

    const assetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };

    let bridgeFeeOptions = {
      assetValue,
      userId: accountKeys.publicKey,
      // userSpendingKeyRequired?: boolean;
      // excludePendingNotes?: boolean;
      // feeSignificantFigures?: number;    
    }

    const fee = (await this.sdk.getDefiFees(bridge, bridgeFeeOptions))[settlementTime];

    const controller = this.sdk.createDefiController(
      accountKeys.publicKey,
      signer,
      bridge,
      assetValue,
      fee
    );
    await controller.createProof();
    const txId = await controller.send();
    // this.log(
    //   "View transaction on the block explorer",
    //   `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    // );
  }
}
