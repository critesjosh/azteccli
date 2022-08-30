import { flags } from "@oclif/command";
import { CLIError } from "@oclif/errors";
import { ParseFn } from "@oclif/parser/lib/args";
import { utils } from "ethers";

const parseAddress: ParseFn<string> = (input: string) => {
  if (utils.isAddress(input)) {
    return input;
  } else {
    throw new CLIError(`${input} is not a valid address`);
  }
};

export const Flags = {
  customAccountMessage: flags.string({
    char: "m",
    description: "Custom message to sign to derive an Aztec account key",
    exclusive: ["accountKey"],
  }),
  accountKey: flags.string({
    char: "k",
    description:
      "An Aztec account private key to use instead of deriving one from an Ethereum wallet.",
    exclusive: ["customAccountMessage"],
  }),
  useAccountKeySigner: flags.boolean({
    description:
      "Create the Aztec signer from the account key and not a registered spending key. Use this if you have funds associated with your account key and not a spending key.",
    default: false,
    exclusive: ["signingKey", "customSignerMessage"],
  }),
  signingKey: flags.string({
    exclusive: ["useAccountKeySigner", "customSignerMessage"],
    description:
      "An Aztec signing private key to use instead of deriving one from an Ethereum wallet.",
  }),
  customSignerMessage: flags.string({
    description: "Custom message to sign to derive an Aztec signing key.",
    exclusive: ["useAccountKeySigner", "signingKey"],
  }),
  spendingKeyRequired: flags.boolean({
    description:
      "Should the recipient be required to have a registered spending key?",
    default: false,
  }),
  ethAddress: flags.build({
    parse: parseAddress,
    description: "Account Address",
    helpValue: "0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d",
  }),
  time: flags.string({
    char: "t",
    description: "transaction time (next is slower + cheaper)",
    options: ["next", "instant"],
    default: "next",
  }),
  recipient: flags.build({
    char: "r",
    description: "Aztec Grumpkin address or registered alias",
  }),
  alias: flags.build({
    description: "alias to register",
  }),
  asset: flags.build({
    char: "a",
    options: ["eth", "dai"],
    default: "eth",
  }),
  logSdk: flags.boolean({
    description: "verbose Aztec SDK logging",
    default: false
  })
};
