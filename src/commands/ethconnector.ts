import { AssetValue, BridgeCallData, EthAddress, virtualAssetIdPlaceholder } from "@aztec/sdk";
import { BaseCommand } from "../base";
import { createElementAdaptor } from "../defiAdaptors/elementAdaptor";
import { createLidoAdaptor } from "../defiAdaptors/lidoAdaptor";
import { Flags } from "../flags";
import networkConfig from "../network_config";
import { parseTime } from "../utils";

export default class EthConnector extends BaseCommand {
  static description = "Relay assets to Ethereum base layer.";

  wstEthTokenAddress = EthAddress.fromString(
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
  );
  daiTokenAddress = EthAddress.fromString(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  );

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

    // https://github.com/AztecProtocol/aztec-connect-bridges/blob/master/deployments/mainnet.json
    // const CurveStEthConnector = this.sdk.getBridgeAddressId(
    //   EthAddress.fromString("0xe09801dA4C74e62fB42DFC8303a1C1BD68073D1a"),
    //   250000
    // );
    // const ElementId = this.sdk.getBridgeAddressId(
    //   EthAddress.fromString("0xC116ecc074040AbEdB2E11A4e84dEcDBA141F38f"),
    //   250000
    // );
    const ethToWstEth = new BridgeCallData(5, 0, 2); // IN: ETH (0), OUT: wstETH (2)
    const WstEthToEth = new BridgeCallData(5, 2, 0); // IN: wstETH (2), OUT: ETH (0)
    const nftConnector = new BridgeCallData(19, 0, virtualAssetIdPlaceholder, undefined, undefined, 0);


    // const elementAdaptor = createElementAdaptor(
    //   this.ethereumProvider,
    //   "0x2266429abF6Ec8A1FC6712c2BbDc7262b40ba442",
    //   "0xC116ecc074040AbEdB2E11A4e84dEcDBA141F38f",
    //   false
    // );

    let connector = nftConnector

    const tokenAssetId = this.sdk!.getAssetIdBySymbol(asset.toUpperCase());
    const tokenQuantity = BigInt((amount as number) * 10 ** 18);

    const tokenAssetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };

    const fee = (await this.sdk.getDefiFees(connector))[settlementTime];
    const controller = this.sdk.createDefiController(
      accountKeys.publicKey,
      signer,
      connector,
      tokenAssetValue,
      fee
    );
    await controller.createProof();
    const txId = await controller.send();
    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }
}
