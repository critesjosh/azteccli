import { GrumpkinAddress } from "@aztec/sdk";
import { CLIError } from "@oclif/core/lib/errors/index.js";
import { BaseCommand } from "../base.js";
import { Flags } from "../flags.js";
import networkConfig from "../network_config.js";
import { parseTime } from "../utils.js";

export default class StageRecoveryKey extends BaseCommand {
  static description =
    "Stage a recovery key to your registered Aztec account and get the recovery payload.";

  static flags = {
    ...BaseCommand.flags,
    time: Flags.time,
    alias: Flags.alias({
      required: true,
      description: "Alias for the account to generate a recovery payload for.",
    }),
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    useAccountKeySigner: Flags.useAccountKeySigner,
    signingKey: Flags.signingKey,
    customSignerMessage: Flags.customSignerMessage,
    spendingKeyRequired: Flags.spendingKeyRequired,
  };

  static args = [
    {
      name: "ttpPubKey",
      required: true,
      description:
        "Aztec public key of the trusted third party that will help recover the account.",
    },
  ];

  static examples = [
    "azteccli stagerecoverykey 0x14574e6b3e1df8b4666eb1f478a42a1731bdde580a27fd9cea83c0ba6043e8be2bfc0e9a229a48a8e4244564622a119877b827b97cf9b66aca02c2a40df5cb03 --alias yourAlias",
  ];

  public async run(): Promise<void> {
    const { time, alias } = this.flags;
    const { ttpPubKey } = this.args;

    if (!(await this.sdk.isAliasRegistered(alias))) {
      throw new CLIError(`Specified alias, ${alias}, is not registered.`);
    }

    let settlementTime = parseTime(time, true);
    let accountKeys = await this.getAccountKeysAndSyncAccount();
    const signer = await this.getSigner();

    if (
      (await this.sdk.getAccountPublicKey(alias))?.toString() !=
      accountKeys.publicKey.toString()
    ) {
      throw new CLIError(
        `Specified alias, ${alias}, does not match the users public key.`
      );
    }

    const fee = (
      await this.sdk.getAddSpendingKeyFees(this.sdk.getAssetIdBySymbol("ETH"))
    )[settlementTime];

    let recoveryPayloads = await this.sdk.generateAccountRecoveryData(
      accountKeys.publicKey,
      alias,
      [GrumpkinAddress.fromString(ttpPubKey)]
    );

    const recoveryPublicKey = recoveryPayloads[0].recoveryPublicKey;

    this.log(
      `Save the following payload information! It cannot be regenerated.\nThe following payload must be submitted before the corresponding ttpPubKey has access to the account.`
    );
    this.log(`Recovery Payload: ${recoveryPayloads}`);

    const controller = this.sdk.createAddSpendingKeyController(
      accountKeys.publicKey,
      signer,
      recoveryPublicKey,
      undefined,
      fee
    );

    await controller.createProof();
    let txId = await controller.send();
    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }
}
