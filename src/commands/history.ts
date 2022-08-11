import { UserDefiClaimTx, UserDefiTx, UserPaymentTx } from "@aztec/sdk";
import { BaseCommand } from "../base";
import { Flags } from "../flags";

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

  private pad(text: string) {
    return text.padEnd(20, " ");
  }

  public async run(): Promise<{ txs: any }> {
    const accountKeys = await this.getAccountKeys();
    let txs = await this.sdk.getUserTxs(accountKeys!.publicKey);

    txs.map((tx) => {
      this.log("----------------");
      this.log(this.pad("Tx Type:"), tx.constructor.name);
      this.log(this.pad("Transaction Id:"), tx.txId?.toString());
      this.log(this.pad("Settled:"), tx.settled?.toUTCString());
      if (tx instanceof UserDefiTx) {
        this.log(this.pad("Deposit Value:"), tx.depositValue);
        this.log("Interaction result:");
        console.dir(tx.interactionResult);
      }
      if (tx instanceof UserPaymentTx) {
        this.log(this.pad("Value:"), tx.value);
        this.log(this.pad("Fee:"), tx.fee);
      }
      if (tx instanceof UserDefiClaimTx) {
        this.log(this.pad("DefiTxId:"), tx.defiTxId.toString());
        this.log("Bridge:");
        this.log(this.pad("Deposit value:"), tx.depositValue);
        this.log(this.pad("Success?:"), tx.success);
        this.log(this.pad("Output value A:"), tx.outputValueA);
        this.log(this.pad("Output value B:"), tx.outputValueB);
      }
    });

    await this.sdk.destroy();
    return { txs };
  }
}

// function toObject() {
//   return JSON.parse(JSON.stringify(this, (key, value) =>
//       typeof value === 'bigint'
//           ? value.toString()
//           : value // return everything else unchanged
//   ));
// }