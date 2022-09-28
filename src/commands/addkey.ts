import { GrumpkinAddress } from "@aztec/sdk";
import { CLIError } from "@oclif/core/lib/errors";
import { CLIENT_RENEG_LIMIT } from "tls";
import { BaseCommand } from "../base";
import { Flags } from "../flags";
import networkConfig from "../network_config";
import { parseTime, deriveCustomAccountKeys } from "../utils";

export default class AddKey extends BaseCommand {
  static description = "Add up to two spending keys to a registered account.";

  static flags = {
    ...BaseCommand.flags,
    time: Flags.time,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    useAccountKeySigner: Flags.useAccountKeySigner,
    signingKey: Flags.signingKey,
    customSignerMessage: Flags.customSignerMessage,
    spendingKeyRequired: Flags.spendingKeyRequired,
    newSigningKey1: Flags.newSigningKey1,
    newSigningKey2: Flags.newSigningKey2,
  };

  static args = [
    {
      name: "number",
      required: true,
      description: "Number of spending keys to register (1 or 2)",
    },
    {
      name: "newSigningKeyMessage1",
      required: false,
      description:
        "Message to sign to generate a new spending key to associate with a registered account.",
    },
    {
      name: "newSigningKeyMessage2",
      required: false,
      description:
        "Message to sign to generate a new spending key to associate with a registered account.",
    },
  ];

  static examples = [];

  public async run(): Promise<void> {
    const { time, newSigningKey1, newSigningKey2 } = this.flags;
    const { number, newSigningKeyMessage1, newSigningKeyMessage2 } = this.args;

    let settlementTime = parseTime(time, true);
    let accountKeys = await this.getAccountKeysAndSyncAccount();
    const signer = await this.getSigner();

    const fee = (
      await this.sdk.getAddSpendingKeyFees(this.sdk.getAssetIdBySymbol("ETH"))
    )[settlementTime];

    let newSigner1: GrumpkinAddress, newSigner2;

    if (number === 1) {
      if (newSigningKey1) {
        newSigner1 = await this.keyToAddress(newSigningKey1);
      } else if (newSigningKeyMessage1) {
        newSigner1 = await this.messageToAddress(newSigningKeyMessage1);
      } else {
        throw new CLIError(
          "You must enter a signing key or message to sign to generate a signing key when registering a new spending key with an account."
        );
      }
    } else if (number === 2) {
      if (newSigningKey1 && newSigningKeyMessage1) {
        newSigner1 = await this.keyToAddress(newSigningKey1);
        newSigner2 = await this.messageToAddress(newSigningKeyMessage1);
      } else if (newSigningKeyMessage1 && newSigningKeyMessage2) {
        newSigner2 = await this.messageToAddress(newSigningKeyMessage1);
        newSigner2 = await this.messageToAddress(newSigningKeyMessage2);
      } else if (newSigningKey1 && newSigningKey2) {
        newSigner1 = await this.keyToAddress(newSigningKey1);
        newSigner2 = await this.keyToAddress(newSigningKey2);
      }
    }

    const controller = this.sdk.createAddSpendingKeyController(
      accountKeys.publicKey,
      signer,
      newSigner1!,
      newSigner2,
      fee
    );

    await controller.createProof();
    let txId = await controller.send();
    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }

  private async messageToAddress(message: string): Promise<GrumpkinAddress> {
    return (
      await deriveCustomAccountKeys(
        message,
        this.ethSigner,
        this.ethereumProvider,
        this.ethereumAccount,
        this.sdk
      )
    ).publicKey;
  }

  private async keyToAddress(key: string): Promise<GrumpkinAddress> {
    return (
      await this.sdk.createSchnorrSigner(Buffer.from(key, "hex"))
    ).getPublicKey();
  }
}
