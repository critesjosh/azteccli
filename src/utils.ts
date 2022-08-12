import {
  AztecSdk,
  EthAddress,
  EthereumProvider,
  AztecSdkUser,
  TxSettlementTime,
  GrumpkinAddress,
  SchnorrSigner,
} from "@aztec/sdk";
import { AztecAccountKeys } from "./base";
import { CliUx } from "@oclif/core";
import { CLIError } from "@oclif/core/lib/errors";
import { JsonRpcSigner } from "@ethersproject/providers";

export async function getAccountKeysAndSyncAccount(
  flags: any,
  sdk: AztecSdk,
  ethSigner: JsonRpcSigner,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress
) {
  let accountKeys = await getAccountKeys(
    flags,
    sdk,
    ethSigner,
    ethereumProvider,
    ethereumAccount
  );
  await getAndSyncAccount(sdk, accountKeys!);
  return accountKeys;
}

export async function getAccountKeys(
  flags: any,
  sdk: AztecSdk,
  ethSigner: JsonRpcSigner | null,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress
): Promise<AztecAccountKeys> {
  if (flags.accountKey) {
    try {
      const privateKey = Buffer.from(flags.accountKey);
      const publicKey = await sdk.derivePublicKey(
        Buffer.from(flags.accountKey)
      );
      return {
        publicKey,
        privateKey,
      };
    } catch (e: any) {
      throw new CLIError(e);
    }
  } else if (flags.customAccountMessage) {
    return await deriveCustomAccountKeys(
      flags.customAccountMessage,
      ethSigner,
      ethereumProvider,
      ethereumAccount,
      sdk
    );
  } else {
    return await getDefaultAccountKeys(sdk, ethereumAccount);
  }
}

export async function deriveCustomAccountKeys(
  message: string,
  ethSigner: JsonRpcSigner | null,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress,
  sdk: AztecSdk
) {
  const signature = await signMessageWithEitherWallet(
    message,
    ethSigner,
    ethereumProvider,
    ethereumAccount
  );
  let privateKey = Buffer.from(signature.slice(0, 32));
  let publicKey = await sdk.derivePublicKey(privateKey);
  return { publicKey, privateKey };
}

export async function getDefaultAccountKeys(
  sdk: AztecSdk,
  ethereumAccount: EthAddress
): Promise<AztecAccountKeys> {
  CliUx.ux.action.start("awaiting user signature");
  const accountKeys = await sdk.generateAccountKeyPair(ethereumAccount);
  CliUx.ux.action.stop();
  return accountKeys;
}

export async function signMessageWithEitherWallet(
  message: string,
  ethSigner: JsonRpcSigner | null,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress
): Promise<string> {
  let signature;
  const providerMessage = `0x${Buffer.from(message, "utf8").toString("hex")}`;
  CliUx.ux.action.start("awaiting user signature");
  // this is the wallet connect case
  if (ethSigner === null) {
    // TODO: test this
    signature = await ethereumProvider.request({
      method: "personal_sign",
      params: [providerMessage, ethereumAccount.toString()],
    });
  } else {
    signature = await ethSigner!.signMessage(message);
  }
  CliUx.ux.action.stop();
  return signature;
}

export async function getAndSyncAccount(
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

export function parseTime(time: string): TxSettlementTime {
  if (time === "next") {
    return TxSettlementTime.NEXT_ROLLUP;
  } else {
    return TxSettlementTime.INSTANT;
  }
}

export async function parseAztecRecipient(
  input: string,
  accountKeys: AztecAccountKeys,
  sdk: AztecSdk
): Promise<GrumpkinAddress> {
  if (input) {
    if (await sdk.isAliasRegistered(input)) {
      return (await sdk.getAccountPublicKey(input))!;
    } else {
      return GrumpkinAddress.fromString(input);
    }
  } else {
    return accountKeys.publicKey;
  }
}

export async function getSigner(
  flags: any,
  accountKeys: AztecAccountKeys,
  ethSigner: JsonRpcSigner,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress,
  sdk: AztecSdk
): Promise<SchnorrSigner> {
  if (flags.signingKey as string) {
    return await sdk.createSchnorrSigner(Buffer.from(flags.signingKey));
  } else if (flags.customSignerMessage) {
    return await createNewSignerFromMessage(
      flags.customSignerMessage,
      ethSigner,
      ethereumProvider,
      ethereumAccount,
      sdk
    );
  } else {
    return await getDefaultSigner(flags, sdk, accountKeys, ethereumAccount);
  }
}

export async function createNewSignerFromMessage(
  message: string,
  ethSigner: JsonRpcSigner | null,
  ethereumProvider: EthereumProvider,
  ethereumAccount: EthAddress,
  sdk: AztecSdk
): Promise<SchnorrSigner> {
  let signature = await signMessageWithEitherWallet(
    message,
    ethSigner,
    ethereumProvider,
    ethereumAccount
  );
  const privateKey = Buffer.from(signature.slice(0, 32));
  return await sdk.createSchnorrSigner(privateKey);
}

export async function getDefaultSigner(
  flags: any,
  sdk: AztecSdk,
  accountKeys: AztecAccountKeys,
  ethereumAccount: EthAddress
): Promise<SchnorrSigner> {
  if (
    !(await sdk.isAccountRegistered(accountKeys.publicKey)) &&
    !flags.accountKeySigner
  ) {
    CliUx.ux.action.start("awaiting user signature");
    const { privateKey } = await sdk.generateSpendingKeyPair(ethereumAccount);
    CliUx.ux.action.stop();
    return await sdk.createSchnorrSigner(privateKey);
  } else {
    return await sdk.createSchnorrSigner(accountKeys.privateKey);
  }
}
