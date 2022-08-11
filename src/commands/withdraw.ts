import {
  AssetValue,
  EthAddress,
  TxSettlementTime,
} from "@aztec/sdk";
// import { flags } from "@oclif/core";
import { Flags } from "../flags"
import { BaseCommand } from "../base";

export default class Withdraw extends BaseCommand {
  static description = "Withdraw funds from the Aztec network.";

  static examples = [
    "azteccli withdraw 0.1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB",
    "azteccli withdraw 1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241",
    "azteccli withdraw 1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'",
  ];

  static flags = {
    ...BaseCommand.flags,
    recipient: Flags.recipient({
      description: "Ethereum account address to withdraw to.",
      required: true,
    }),
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
  };

  static args = [{ name: "amount" }];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse();
    let settlementTime = this.parseTime(flags.time);
    let recipient: EthAddress = EthAddress.fromString(flags.recipient);

    const accountKeys = await this.getAccountKeys();
    const signer = await this.getSigner();

    const tokenQuantity = BigInt((args.amount as number) * 10 ** 18);
    const tokenAssetId = this.sdk!.getAssetIdBySymbol(
      flags.asset.toUpperCase()
    );
    const tokenTransferFee = (await this.sdk!.getWithdrawFees(tokenAssetId))[
      settlementTime
    ];
    const tokenAssetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };
    const tokenWithdrawController = this.sdk!.createWithdrawController(
      accountKeys!.publicKey,
      signer,
      tokenAssetValue,
      tokenTransferFee,
      recipient
      // optional feePayer
    );

    let txId = await tokenWithdrawController.send();
    this.log("Aztec txId", txId.toString());

    await this.sdk.destroy();
  }
}
