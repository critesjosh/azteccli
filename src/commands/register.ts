import { EthAddress, GrumpkinAddress, TxSettlementTime } from "@aztec/sdk";
import { Flags } from "../flags";
import { flags } from "@oclif/command";
import { BaseCommand } from "../base";

export default class Register extends BaseCommand {
  static description = "Register a new aztec account.";

  static examples = [
    "azteccli register --alias testooor --deposit 0.1 --ttpPubKey 92b2dbc645eab72f3e3851a7d6dfb1bad170bdf444b5770644f6dd7def66ad31",
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
    const { args, flags } = await this.parse();
    const accountKeys = await this.getAccountKeys();

    if (await this.sdk.isAliasRegistered(flags.alias, true)) {
      throw new Error("Alias is already registered.");
    }

    let recoveryPublicKey = undefined;
    let depositor = this.ethereumAccount;

    if (flags.depositor) {
      depositor = EthAddress.fromString(flags.depositor);
    }

    if (flags.ttpPubKey) {
      let recoveryPayloads = await this.sdk.generateAccountRecoveryData(
        accountKeys!.publicKey,
        flags.alias,
        [GrumpkinAddress.fromString(flags.ttpPubKey)]
      );
      recoveryPublicKey = recoveryPayloads[0].recoveryPublicKey;
    } else {
      this.log("Recovery public key not set for this account.");
    }

    let settlementTime = this.parseTime(flags.time);

    const signer = await this.getSigner();

    const tokenQuantity = BigInt((args.deposit as number) * 10 ** 18);
    const assetId = this.sdk!.getAssetIdBySymbol(flags.asset.toUpperCase());
    const deposit = { assetId, value: tokenQuantity };
    const txFee = (await this.sdk.getRegisterFees(deposit))[settlementTime];

    const controller = await this.sdk.createRegisterController(
      accountKeys!.publicKey,
      flags.alias,
      accountKeys!.privateKey,
      signer.getPublicKey(),
      recoveryPublicKey,
      deposit,
      txFee,
      depositor
      // optional feePayer requires an Aztec Signer to pay the fee
    );

    if ((await controller.getPendingFunds()) < tokenQuantity) {
      await controller.depositFundsToContract();
      await controller.awaitDepositFundsToContract();
    }

    await controller.createProof();
    await controller.sign();
    let txId = await controller.send();

    console.log("Register tx id: ", txId.toString());

    await this.sdk.destroy();
  }
}
