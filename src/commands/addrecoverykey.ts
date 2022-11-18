import { AssetValue, RecoveryPayload } from "@aztec/sdk";
import { Flags as flags } from "@oclif/core";
import { Flags } from "../flags.js";
import { BaseCommand } from "../base.js";
import { parseTime } from "../utils.js";
import networkConfig from "../network_config.js";

export default class AddRecoveryKey extends BaseCommand {
  static description = "Add a staged recovery account key to an Aztec account with the RecoveryPayload.";

  static examples = ["azteccli addrecoverykey .01 --recoveryPayload 0x20e4fee0dace3d58b5d30a1fcd2ec682581e92ccd1b23f9a25b007097c86cd61033293008cb23cc99c07a6c9f6e7d9edd6a46373f7f01b9e7c2b67464690066f037027b6b72b4768ed5d189e05efecb506e08b05ab5aceb6942e20a974bac80a0208a5e2ee037d9cbf38607998cf48c2b4bc946906a990c20695e20412d1740b14574e6b3e1df8b4666eb1f478a42a1731bdde580a27fd9cea83c0ba6043e8be2bfc0e9a229a48a8e4244564622a119877b827b97cf9b66aca02c2a40df5cb031d4ac61d92c23186af8bfa59aecb5e98e7390757791924f94ef45d4b7de4306e35910daf67b99ad0d3f6e9261577b54ac90a5fc9280f5be5166cf5992185a7e5"];

  static flags = {
    ...BaseCommand.flags,
    asset: Flags.asset(),
    time: Flags.time,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    spendingKeyRequired: Flags.spendingKeyRequired,
    recoveryPayload: flags.string({
        required: true,
        description: "The recovery payload to add the recovery account as a spending key."
    })
  };

  static args = [{ name: "amount", required: true }];

  public async run(): Promise<void> {
    const { time, asset, recoveryPayload } = this.flags;
    const { amount } = this.args;

    let accountKeys = await this.getAccountKeysAndSyncAccount();
    // defaults to next rollup
    let settlementTime = parseTime(time);

    const tokenQuantity = BigInt((amount as number) * 10 ** 18);
    const tokenAssetId = this.sdk!.getAssetIdBySymbol(asset.toUpperCase());
    const tokenDepositFee = (await this.sdk!.getDepositFees(tokenAssetId))[
      settlementTime
    ];
    const deposit: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };

    const controller = this.sdk!.createRecoverAccountController(
      recoveryPayload,
      deposit,
      tokenDepositFee,
      this.ethereumAccount!
    );

    if (
      (await controller.getPendingFunds()) < deposit.value
    ) {
      if (asset === "dai") {
        if (
          (await controller.getPublicAllowance()) <
          deposit.value
        ) {
          await controller.approve();
          await controller.awaitApprove();
        }
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
