import { CliUx } from "@oclif/core";
import { Command } from "@oclif/core";
import {
  createAztecSdk,
  EthAddress,
  EthersAdapter,
  EthereumProvider,
  SdkFlavour,
  AztecSdk,
  AztecSdkUser,
  GrumpkinAddress,
  SchnorrSigner,
  TxSettlementTime,
} from "@aztec/sdk";
import { ethers } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { createWalletconnectProvider } from "./wallet_providers/walletconnect_provider";
const Conf = require("conf");
const config = new Conf();
import networkConfig from "./network_config";
import {
  createNewSignerFromMessage,
  getAccountKeys,
  getAndSyncAccount,
  getDefaultSigner,
} from "./utils";

export type AztecAccountKeys = {
  publicKey: GrumpkinAddress;
  privateKey: Buffer;
};

export abstract class BaseCommand extends Command {
  // public requireSynced = true;
  public sdk!: AztecSdk;
  public ethereumProvider!: EthereumProvider;
  public ethereumAccount!: EthAddress;
  public ethSigner: JsonRpcSigner | null = null;
  public chainId!: number;
  protected accountKeys: AztecAccountKeys | null = null;
  public flags: any;
  // protected aztecAccount: AztecSdkUser | null = null;

  static flags = {};

  async init() {
    const { args, flags } = await this.parse();
    this.flags = flags;

    if (config.get("wallet") === "walletconnect") {
      let wcProvider = await createWalletconnectProvider(
        "c5f107bac5184a2bb4ee5f88f3554ba5"
      );
      await wcProvider.connect();
      this.ethereumProvider = wcProvider.ethereumProvider;
      let accounts = await this.ethereumProvider.request({
        method: "eth_accounts",
      });
      this.ethereumAccount = EthAddress.fromString(accounts[0]);
    } else {
      let ethersProvider = new ethers.providers.JsonRpcProvider(
        "http://localhost:24012/rpc"
      );
      this.ethereumProvider = new EthersAdapter(ethersProvider);
      this.ethSigner = ethersProvider.getSigner() as JsonRpcSigner;
      this.ethereumAccount = EthAddress.fromString(
        await this.ethSigner!.getAddress()
      );
    }

    this.chainId = parseInt(
      await this.ethereumProvider.request({
        method: "eth_chainId",
      }),
      16
    );

    CliUx.ux.action.start("setting up the SDK");

    this.sdk = await createAztecSdk(this.ethereumProvider, {
      serverUrl: networkConfig[this.chainId].rollupProvider,
      pollInterval: 10000,
      // memoryDb: true,
      debug: "bb:*",
      flavour: SdkFlavour.PLAIN,
      minConfirmation: 1, // ETH block confirmations
    });

    await this.sdk.run();

    CliUx.ux.action.stop();
  }

  async getSigner(): Promise<SchnorrSigner> {
    if (this.flags.signingKey) {
      return await this.sdk.createSchnorrSigner(
        Buffer.from(this.flags.signingKey as string)
      );
    } else if (this.flags.customSignerMessage) {
      return await createNewSignerFromMessage(
        this.flags.customSignerMessage,
        this.ethSigner,
        this.ethereumProvider,
        this.ethereumAccount,
        this.sdk
      );
    } else {
      return await getDefaultSigner(
        this.flags,
        this.sdk,
        this.accountKeys!,
        this.ethereumAccount
      );
    }
  }

  async getAccountKeysAndSyncAccount() {
    this.accountKeys = await getAccountKeys(
      this.flags,
      this.sdk,
      this.ethSigner,
      this.ethereumProvider,
      this.ethereumAccount
    );
    await getAndSyncAccount(this.sdk, this.accountKeys);
    return this.accountKeys;
  }
}
