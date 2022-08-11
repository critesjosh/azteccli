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
import { ethers, providers } from "ethers";
import { createWalletconnectProvider } from "./wallet_providers/walletconnect_provider";
const Conf = require("conf");
const config = new Conf();
import networkConfig from "./network_config";

type AztecAccountKeys = {
  publicKey: GrumpkinAddress;
  privateKey: Buffer;
};

export abstract class BaseCommand extends Command {
  public requireSynced = true;
  public sdk!: AztecSdk;
  public ethereumProvider!: EthereumProvider;
  public ethereumAccount!: EthAddress;
  public ethSigner: providers.JsonRpcSigner | null = null;
  public chainId!: number;
  protected accountKeys: AztecAccountKeys | null = null;
  protected aztecAccount: AztecSdkUser | null = null;

  static flags = {};

  async init() {
    // await this.setConfig();

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
      this.ethSigner = ethersProvider.getSigner();
      this.ethereumAccount = EthAddress.fromString(
        await this.ethSigner.getAddress()
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

  async getAccountKeys(): Promise<AztecAccountKeys | undefined> {
    const { flags } = await this.parse();

    if (flags.accountKey) {
      try {
        const privateKey = Buffer.from(flags.accountKey);
        const publicKey = await this.sdk.derivePublicKey(
          Buffer.from(flags.accountKey)
        );
        this.accountKeys = {
          publicKey,
          privateKey,
        };
        this.aztecAccount = await getAndSyncAccount(this.sdk, this.accountKeys);
        return this.accountKeys;
      } catch (e) {
        console.error(e);
      }
    } else if (flags.customAccountMessage) {
      return await this.deriveCustomAccountKeys(flags.customAccountMessage);
    } else {
      return await this.getDefaultAccountKeys();
    }
  }

  async getDefaultAccountKeys() {
    if (this.accountKeys === null) {
      CliUx.ux.action.start("awaiting user signature");
      this.accountKeys = await this.sdk.generateAccountKeyPair(
        this.ethereumAccount
      );
      CliUx.ux.action.stop();
    }
    this.aztecAccount = await getAndSyncAccount(this.sdk, this.accountKeys);
    return this.accountKeys;
  }

  async deriveCustomAccountKeys(message: string) {
    let signature;
    // not sure if this is needed
    const providerMessage = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    CliUx.ux.action.start("awaiting user signature");
    // this is the wallet connect case
    if (this.ethSigner === null) {
      // TODO: test this
      signature = await this.ethereumProvider.request({
        method: "personal_sign",
        params: [providerMessage, this.ethereumAccount],
      });
    } else {
      signature = await this.ethSigner!.signMessage(message);
    }
    CliUx.ux.action.stop();

    let privateKey = signature.slice(0, 32);
    let publicKey = await this.sdk.derivePublicKey(privateKey);
    this.accountKeys = { publicKey, privateKey };
    this.aztecAccount = await getAndSyncAccount(this.sdk, this.accountKeys);
    return this.accountKeys;
  }

  async getSigner(): Promise<SchnorrSigner> {
    const { flags } = await this.parse();

    if (flags.signingKey !== undefined) {
      return await this.sdk.createSchnorrSigner(
        Buffer.from(flags.signingKey as string)
      );
    } else if (flags.customSignerMessage !== undefined) {
      return await this.createNewSignerFromMessage(flags.customSignerMessage);
    } else {
      return await this.getDefaultSigner();
    }
  }

  async getDefaultSigner(): Promise<SchnorrSigner> {
    const { flags } = await this.parse();
    let accountKeys = await this.getAccountKeys();

    if (
      (await this.sdk.isAccountRegistered(this.accountKeys!.publicKey)) &&
      !flags.accountKeySigner
    ) {
      CliUx.ux.action.start("awaiting user signature");
      const { privateKey } = await this.sdk.generateSpendingKeyPair(
        this.ethereumAccount
      );
      CliUx.ux.action.stop();
      return await this.sdk.createSchnorrSigner(privateKey);
    } else {
      return await this.sdk.createSchnorrSigner(accountKeys!.privateKey);
    }
  }

  async createNewSignerFromMessage(message: string): Promise<SchnorrSigner> {
    let signature;
    // not sure if this is needed
    const providerMessage = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    CliUx.ux.action.start("awaiting user signature");
    // this is the wallet connect case
    if (this.ethSigner === null) {
      // TODO: test this
      signature = await this.ethereumProvider.request({
        method: "personal_sign",
        params: [providerMessage, this.ethereumAccount],
      });
    } else {
      signature = await this.ethSigner!.signMessage(message);
    }
    CliUx.ux.action.stop();
    const privateKey = signature.slice(0, 32);
    return await this.sdk.createSchnorrSigner(privateKey);
  }

  async parseAztecRecipient(
    sdk: AztecSdk,
    input: string
  ): Promise<GrumpkinAddress> {
    if (input) {
      if (await sdk.isAliasRegistered(input)) {
        return (await sdk.getAccountPublicKey(input))!;
      } else {
        return GrumpkinAddress.fromString(input);
      }
    } else {
      console.log(this.accountKeys?.publicKey);
      return this.accountKeys!.publicKey;
    }
  }

  public parseTime(time: string): TxSettlementTime {
    if (time === "next") {
      return TxSettlementTime.NEXT_ROLLUP;
    } else {
      return TxSettlementTime.INSTANT;
    }
  }
}

async function getAndSyncAccount(
  sdk: AztecSdk,
  accountKeys: AztecAccountKeys
): Promise<AztecSdkUser> {
  let aztecAccount;
  if (!(await sdk.userExists(accountKeys.publicKey))) {
    aztecAccount = await sdk.addUser(accountKeys.privateKey);
  } else {
    aztecAccount = await sdk.getUser(accountKeys.publicKey);
  }
  await aztecAccount.awaitSynchronised();
  return aztecAccount;
}
