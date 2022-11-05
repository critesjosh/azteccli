import { EthAddress, GrumpkinAddress } from "@aztec/sdk";
import { Flags as flags } from "@oclif/core";
import { Flags } from "../flags.js";
import { BaseCommand } from "../base.js";
import { CLIError } from "@oclif/core/lib/errors";
import { parseTime } from "../utils.js";
import networkConfig from "../network_config.js";

export default class Register extends BaseCommand {
  static description = "Register a new aztec account.";

  static examples = [
    "azteccli register .1 --alias testooor --ttpPubKey 92b2dbc645eab72f3e3851a7d6dfb1bad170bdf444b5770644f6dd7def66ad31",
    "azteccli register --alias testooor -m 'custom account key derivation message'",
    "azteccli register --alias testooor --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'",
    "azteccli register --alias testooor --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241",
  ];

  static flags = {
    ...BaseCommand.flags,
    alias: Flags.alias({
      required: true,
    }),
    ttpPubKey: flags.string({
      required: false,
      description:
        "trusted third party public key from which to generate the recovery public key",
    }),
    depositor: flags.string({
      description:
        "optional alternative ethereum depositor to pay fees if you're not paying with the account you're currently logged in with",
      required: false,
    }),
    time: Flags.time,
    asset: Flags.asset(),
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    useAccountKeySigner: Flags.useAccountKeySigner,
    signingKey: Flags.signingKey,
    customSignerMessage: Flags.customSignerMessage,
    spendingKeyRequired: Flags.spendingKeyRequired,
  };

  static args = [
    {
      name: "deposit",
      description: "amount to deposit with registration (can be 0)",
      default: 0,
    },
  ];

  public async run(): Promise<void> {
    const { alias, ttpPubKey, time, asset } = this.flags;
    const { deposit } = this.args;

    if (await this.sdk.isAliasRegistered(alias, true)) {
      throw new CLIError("Alias is already registered.");
    }

    const accountKeys = await this.getAccountKeysAndSyncAccount();

    if (await this.sdk.isAccountRegistered(accountKeys.publicKey, true)) {
      throw new CLIError("Account is already registered.");
    }

    const depositor = this.flags.depositor
      ? EthAddress.fromString(this.flags.depositor)
      : this.ethereumAccount;

    let recoveryPublicKey = undefined;

    if (ttpPubKey) {
      let recoveryPayloads = await this.sdk.generateAccountRecoveryData(
        accountKeys.publicKey,
        alias,
        [GrumpkinAddress.fromString(ttpPubKey)]
      );
      recoveryPublicKey = recoveryPayloads[0].recoveryPublicKey;
    } else {
      this.log("Recovery public key not set for this account.");
    }

    let settlementTime = await parseTime(time);

    const signer = await this.getSigner();

    const tokenQuantity = BigInt((deposit as number) * 10 ** 18);
    const assetId = this.sdk.getAssetIdBySymbol(asset.toUpperCase());
    const depositValue = { assetId, value: tokenQuantity };
    const txFee = (await this.sdk.getRegisterFees(assetId))[settlementTime];

    const controller = await this.sdk.createRegisterController(
      accountKeys.publicKey,
      alias,
      accountKeys.privateKey,
      signer.getPublicKey(),
      recoveryPublicKey, // defaults to nothing
      depositValue,
      txFee,
      depositor // defaults to the logged in Ethereum accounts
    );

    if ((await controller.getPendingFunds()) < tokenQuantity) {
      if (
        asset === "dai" &&
        (await controller.getPublicAllowance()) < depositValue.value
      ) {
        await controller.approve();
        await controller.awaitApprove();
      }
      await controller.depositFundsToContract();
      await controller.awaitDepositFundsToContract();
    }

    await controller.createProof();
    await controller.sign();
    let txId = await controller.send();

    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }
}
