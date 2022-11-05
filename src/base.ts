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
} from "@aztec/sdk";
import { ethers } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { createWalletconnectProvider } from "./wallet_providers/walletconnect_provider.js";
import * as fs from "fs-extra";
import * as path from "path";
import networkConfig from "./network_config.js";
import {
  createNewSignerFromMessage,
  getAccountKeys,
  getAndSyncAccount,
  getDefaultSigner,
  mergeConfigWithFlags,
} from "./utils.js";
import { CLIError } from "@oclif/core/lib/errors";
import { Flags } from "./flags.js";
require("dotenv").config();

export type AztecAccountKeys = {
  publicKey: GrumpkinAddress;
  privateKey: Buffer;
};

export abstract class BaseCommand extends Command {
  public sdk!: AztecSdk;
  public ethereumProvider!: EthereumProvider;
  public ethereumAccount!: EthAddress;
  public ethSigner: JsonRpcSigner | null = null;
  public chainId!: number;
  protected accountKeys: AztecAccountKeys | null = null;
  public flags: any;
  public args: any;
  protected aztecAccount: AztecSdkUser | null = null;

  static flags = {
    logSdk: Flags.logSdk as any,
  };

  async init() {
    const { args, flags } = await this.parse();
    this.args = args;

    // this setting controls where the config file is searched for
    // DEV looks in the project root for a config
    // anything else looks in the oclif default location, https://oclif.io/docs/config#custom-user-configuration
    const configFile =
      process.env.ENV === "DEV"
        ? path.join(__dirname, "..", "config.json")
        : path.join(this.config.configDir, "config.json");

    const userConfig = await fs.readJSON(configFile);
    this.flags = mergeConfigWithFlags(userConfig, flags);

    let wallet = userConfig.wallet;

    if (!wallet) {
      wallet = (
        (await CliUx.ux.prompt(
          "Do you want to use Metamask or WalletConnect?"
        )) as string
      ).toLowerCase();
      this.log(
        "You can save your wallet preference with the command 'azteccli conf wallet metamask|walletconnect'."
      );
    }

    if (wallet === "walletconnect") {
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
      try {
        let ethersProvider = new ethers.providers.JsonRpcProvider(
          "http://localhost:24012/rpc"
        );
        this.ethereumProvider = new EthersAdapter(ethersProvider);
        this.ethSigner = ethersProvider.getSigner() as JsonRpcSigner;
        this.ethereumAccount = EthAddress.fromString(
          await this.ethSigner!.getAddress()
        );
      } catch (error: any) {
        this.log(error);
        throw new CLIError(
          "Make sure to start Truffle dashboard before running a command when Metamask is the specified wallet."
        );
      }
    }

    this.chainId = parseInt(
      await this.ethereumProvider.request({
        method: "eth_chainId",
      }),
      16
    );

    CliUx.ux.action.start("Setting up the SDK");

    let debug = this.flags.logSdk ? "bb:*" : "";

    this.sdk = await createAztecSdk(this.ethereumProvider, {
      serverUrl: networkConfig[this.chainId].rollupProvider,
      pollInterval: 10000, // poll for updates every 10s
      // memoryDb: true, // commented out means it will save data in ./data
      debug,
      flavour: SdkFlavour.PLAIN, // used in a Nodejs context
      minConfirmation: 1, // ETH block confirmations
    });

    await this.sdk.run();
    await this.sdk.awaitSynchronised(); // wait for the SDK to sync before doing stuff to get latest data

    CliUx.ux.action.stop();
  }

  async getSigner(
    signingKey: string | undefined = this.flags.signingKey,
    customSignerMessage: string | undefined = this.flags.customSignerMessage,
    useAccountKeySigner: boolean = this.flags.useAccountKeySigner
  ): Promise<SchnorrSigner> {
    if (signingKey) {
      return await this.sdk.createSchnorrSigner(
        Buffer.from(this.flags.signingKey as string)
      );
    } else if (customSignerMessage) {
      return await createNewSignerFromMessage(
        this.flags.customSignerMessage,
        this.ethSigner,
        this.ethereumProvider,
        this.ethereumAccount,
        this.sdk
      );
    } else if (useAccountKeySigner) {
      return await this.sdk.createSchnorrSigner(this.accountKeys!.privateKey);
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
    this.aztecAccount = await getAndSyncAccount(this.sdk, this.accountKeys);
    return this.accountKeys;
  }

  async finally(arg: Error | undefined) {
    try {
      await this.sdk.destroy();
    } catch (error) {
      this.log(`Failed to close the connection: ${error}`);
    }

    return super.finally(arg);
  }
}
