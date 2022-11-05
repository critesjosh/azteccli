import { AssetValue } from "@aztec/sdk";
// import { Flags } from "@oclif/core";
import { Flags } from "../flags.js";
import { BaseCommand } from "../base.js";
import { parseTime, parseAztecRecipient } from "../utils.js";
import networkConfig from "../network_config.js";

export default class Deposit extends BaseCommand {
  static description = "Deposit funds to aztec.";

  static examples = [
    "azteccli deposit 0.1",
    "azteccli deposit 1 --asset dai --time instant",
    "azteccli deposit 1 -a dai -t instant",
    "azteccli deposit 1 -a eth -r 0x20e4fee0dace3d58b5d30a1fcd2ec682581e92ccd1b23f9a25b007097c86cd61033293008cb23cc99c07a6c9f6e7d9edd6a46373f7f01b9e7c2b67464690066f",
    "azteccli deposit 1 -m 'custom account key derivation message'",
    "azteccli deposit 1 --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9",
  ];

  static flags = {
    ...BaseCommand.flags,
    recipient: Flags.recipient(),
    asset: Flags.asset(),
    time: Flags.time,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    spendingKeyRequired: Flags.spendingKeyRequired,
  };

  static args = [{ name: "amount", required: true }];

  public async run(): Promise<void> {
    const { time, asset, recipient, spendingKeyRequired } = this.flags;
    const { amount } = this.args;
    let useSpendingAccount = spendingKeyRequired;

    let accountKeys = await this.getAccountKeysAndSyncAccount();
    // defaults to next rollup
    let settlementTime = parseTime(time);
    // defaults to the users account
    let to = await parseAztecRecipient(recipient, accountKeys, this.sdk);

    const isRegistered = await this.sdk.isAccountRegistered(
      accountKeys.publicKey,
      true
    );

    if (spendingKeyRequired === undefined && isRegistered) {
      useSpendingAccount = true;
    }

    // if useSpendingAccount === undefined, deposit will be to the base/root account
    this.log(`Depositing to spending account? ${useSpendingAccount}`);

    const tokenQuantity = BigInt((amount as number) * 10 ** 18);

    const tokenAssetId = this.sdk!.getAssetIdBySymbol(asset.toUpperCase());

    const tokenDepositFee = (await this.sdk!.getDepositFees(tokenAssetId))[
      settlementTime
    ];

    const tokenAssetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };

    const tokenDepositController = this.sdk!.createDepositController(
      this.ethereumAccount!,
      tokenAssetValue,
      tokenDepositFee,
      to,
      useSpendingAccount
    );

    if (
      (await tokenDepositController.getPendingFunds()) < tokenAssetValue.value
    ) {
      if (asset === "dai") {
        if (
          (await tokenDepositController.getPublicAllowance()) <
          tokenAssetValue.value
        ) {
          await tokenDepositController.approve();
          await tokenDepositController.awaitApprove();
        }
      }
      await tokenDepositController.depositFundsToContract();
      await tokenDepositController.awaitDepositFundsToContract();
    }

    await tokenDepositController.createProof();
    await tokenDepositController.sign();
    let txId = await tokenDepositController.send();
    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }
}
