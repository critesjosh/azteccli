import { UserDefiClaimTx, UserDefiTx, UserPaymentTx } from "@aztec/sdk";
import { BaseCommand } from "../base.js";
import { Flags } from "../flags.js";
import networkConfig from "../network_config.js";
import { pad } from "../utils.js";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

(Buffer.prototype as any).toJSON = function () {
  return this.toString("hex");
};

export default class History extends BaseCommand {
  static description = "Get your Aztec tx history";

  static examples = [
    "azteccli history",
    "azteccli history -m 'custom account key derivation message'",
    "azteccli history --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9",
  ];

  static flags = {
    ...BaseCommand.flags,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
  };

  static enableJsonFlag = true;

  public async run(): Promise<{ txsWithUrl: any }> {
    const accountKeys = await this.getAccountKeysAndSyncAccount();
    let txs = await this.sdk.getUserTxs(accountKeys!.publicKey);

    let txsWithUrl = txs.map((tx) => {
      const url = `${
        networkConfig[this.chainId].explorerUrl
      }tx/${tx.txId?.toString()}`;
      this.log("----------------");
      this.log(pad("Tx Type:"), tx.constructor.name);
      this.log(pad("Transaction Id:"), tx.txId?.toString());
      this.log(pad("Explorer Url:"), url);
      this.log(pad("Settled:"), tx.settled?.toUTCString());
      if (tx instanceof UserDefiTx) {
        this.log(pad("Deposit Value:"), tx.depositValue);
        this.log("Interaction result:");
        console.dir(tx.interactionResult);
      }
      if (tx instanceof UserPaymentTx) {
        this.log(pad("Value:"), tx.value);
        this.log(pad("Fee:"), tx.fee);
      }
      if (tx instanceof UserDefiClaimTx) {
        this.log(pad("DefiTxId:"), tx.defiTxId.toString());
        this.log("Bridge:");
        this.log(pad("Deposit value:"), tx.depositValue);
        this.log(pad("Success?:"), tx.success);
        this.log(pad("Output value A:"), tx.outputValueA);
        this.log(pad("Output value B:"), tx.outputValueB);
      }
      return {
        ...tx,
        url,
      };
    });

    return { txsWithUrl };
  }
}
