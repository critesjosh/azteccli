import { BaseCommand } from "../base";
import { Flags } from "../flags";

export default class Balance extends BaseCommand {
  static description =
    "Print total zkETH balance, spendable balance associated with the privacy account and spendable balance associated with spending keys.";

  static flags = {
    ...BaseCommand.flags,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
  };

  static examples = [
    "azteccli balance",
    "azteccli balance -m 'custom account key derivation message'",
    "azteccli balance --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9",
  ];

  public async run(): Promise<void> {
    let accountKeys = await this.getAccountKeysAndSyncAccount();

    let balance = this.sdk.fromBaseUnits(
      await this.sdk.getBalance(
        accountKeys!.publicKey,
        this.sdk.getAssetIdBySymbol("ETH")
      )
    );

    let spendableAccountSum = this.sdk.fromBaseUnits({
      assetId: 0,
      value: await this.sdk.getSpendableSum(accountKeys!.publicKey, 0, false),
    });

    let spendableSpendingKeySum = this.sdk.fromBaseUnits({
      assetId: 0,
      value: await this.sdk.getSpendableSum(accountKeys!.publicKey, 0, true),
    });

    let pendingSpendingKeySum = this.sdk.fromBaseUnits({
      assetId: 0,
      value: await this.sdk.getSpendableSum(
        accountKeys!.publicKey,
        0,
        true,
        false
      ),
    });

    const padding = 50;

    this.log(`Total zkETH Balance:`.padEnd(padding, " "), balance);
    this.log(
      "Spendable base account zkETH Balance:".padEnd(padding, " "),
      spendableAccountSum
    );
    this.log(
      "Spendable registered account zkETH Balance:".padEnd(padding, " "),
      spendableSpendingKeySum
    );
    this.log(
      "Pending registered account zkETH Balance:".padEnd(padding, " "),
      pendingSpendingKeySum
    );
  }
}
