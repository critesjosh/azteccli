# azteccli

**This project is in development. Use at your own risk.**

A command line application for interacting with the Aztec protocol. 

Quick intro on Youtube here:

[![Preview](/img/preview.png)](https://youtu.be/Og04qRak-SM)

Does not handle your keys--connects to [Metamask](https://metamask.io/) with [Truffle Dashboard](https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/) or to any wallet that supports [WalletConnect](https://docs.walletconnect.com/). **Metamask is the preferred wallet, this has not been tested extensively with wallet connect.**

Uses [conf-cli](https://github.com/natzcam/conf-cli) for setting and getting the wallet config. Set wallet with `azteccli conf wallet metamask|walletconnect`.

## Getting started

1. [Install Nodejs](https://nodejs.org/en/download/)
2. [Install Yarn](https://classic.yarnpkg.com/lang/en/docs/install)
3. [Install Truffle](https://trufflesuite.com/docs/truffle/getting-started/installation/) or a wallet that supports [WalletConnect](https://walletconnect.com).
4. Install azteccli. `$ yarn global add azteccli`.
   1. You may be prompted to select an `@aztec/bridge-clients` version. Select the highest version number.
   2. Add global yarn packages to your shell PATH.
      1. Run `yarn global bin` to see where the yarn global packages are located.
      2. Add the yarn global install location to your PATH if it isn't already. ie. Add `export PATH="/home/josh/.yarn/bin:$PATH"` to ~/.bashrc.
5. Set metamask. `$ azteccli conf wallet metamask`.
6. Start [Truffle dashboard](https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/). `$ truffle dashboard`
7. Run a command: (ie`$ azteccli history`)

## Config

You can save some account information that is passed to commands as flags in the config so you don't have to enter every time. These flags can be saved in the config:

- `accountKey`
- `signingKey`
- `customAccountMessage`
- `customSignerMessage`
- `useAccountKeySigner`

Flag info overrides config info. So if information is passed to a command via a flag and there is corresponding information saved in the config file, the info passed via the flag will be used. For example, if accountKey `abc` is saved in the config and accountKey `123` is passed via a flag, accountKey `123` will be used.

Be careful with what information you save in this file, particularly account keys or signing keys. I recommend only saving private keys for testnet accounts.

If you are running commands directly from this repo, the config file is located at `./config.json`. If you are running a published version of the cli that you got from npm, the config is located at the oclif default location (https://oclif.io/docs/config#custom-user-configuration).

## Development

1. Clone the repo.
2. Install dependencies. `yarn`
2. Edit/add new commands in `./src/`
3. Test your edits by running `./bin/dev [command] [args] [flags]`. (ie `./bin/dev deposit .01`)


## Capabilities

- Connect to Metamask or other wallet via WalletConnect (enables hardware wallet support)
- Lookup your Aztec tx history
- Lookup your account balances
- Lookup current transaction fees
- Deposit ETH or DAI to Aztec
- Transfer ETH or DAI on the Aztec network
- Withdraw funds to Ethereum from the Aztec network
- Use Aztec test networks
- Register an aztec account (alias + spending keys)
- Create an Aztec signer from an account key (not a spending key)
- Create an Aztec signer by signing an arbitrary message with an Ethereum wallet
- Use an arbitrary private key as an Aztec account key or spending key

TODO:

- defi interactions
- migrate aztec account
- recover aztec account

## Commands

  <!-- commands -->
- [azteccli](#azteccli)
  - [Getting started](#getting-started)
  - [Config](#config)
  - [Development](#development)
  - [Capabilities](#capabilities)
  - [Commands](#commands)
  - [`azteccli accountinfo`](#azteccli-accountinfo)
  - [`azteccli addkey NUMBER [NEWSIGNINGKEYMESSAGE1] [NEWSIGNINGKEYMESSAGE2]`](#azteccli-addkey-number-newsigningkeymessage1-newsigningkeymessage2)
  - [`azteccli balance`](#azteccli-balance)
  - [`azteccli defibridge AMOUNT`](#azteccli-defibridge-amount)
  - [`azteccli deposit AMOUNT`](#azteccli-deposit-amount)
  - [`azteccli getbridges`](#azteccli-getbridges)
  - [`azteccli getfees`](#azteccli-getfees)
  - [`azteccli help [COMMAND]`](#azteccli-help-command)
  - [`azteccli history`](#azteccli-history)
  - [`azteccli plugins`](#azteccli-plugins)
  - [`azteccli plugins:install PLUGIN...`](#azteccli-pluginsinstall-plugin)
  - [`azteccli plugins:inspect PLUGIN...`](#azteccli-pluginsinspect-plugin)
  - [`azteccli plugins:install PLUGIN...`](#azteccli-pluginsinstall-plugin-1)
  - [`azteccli plugins:link PLUGIN`](#azteccli-pluginslink-plugin)
  - [`azteccli plugins:uninstall PLUGIN...`](#azteccli-pluginsuninstall-plugin)
  - [`azteccli plugins:uninstall PLUGIN...`](#azteccli-pluginsuninstall-plugin-1)
  - [`azteccli plugins:uninstall PLUGIN...`](#azteccli-pluginsuninstall-plugin-2)
  - [`azteccli plugins:update`](#azteccli-pluginsupdate)
  - [`azteccli register [DEPOSIT]`](#azteccli-register-deposit)
  - [`azteccli transfer AMOUNT`](#azteccli-transfer-amount)
  - [`azteccli withdraw [AMOUNT]`](#azteccli-withdraw-amount)

## `azteccli accountinfo`

Print Grumpkin address public key.

```
USAGE
  $ azteccli accountinfo [--logSdk] [-m <value> | -k <value>] [--json]

FLAGS
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  --logSdk                            verbose Aztec SDK logging

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Print Grumpkin address public key.

EXAMPLES
  $ azteccli accountinfo

  $ azteccli accountinfo -m 'custom account key derivation message'

  $ azteccli accountinfo --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9
```

_See code: [dist/commands/accountinfo.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/accountinfo.ts)_

## `azteccli addkey NUMBER [NEWSIGNINGKEYMESSAGE1] [NEWSIGNINGKEYMESSAGE2]`

Add up to two spending keys to a registered account.

```
USAGE
  $ azteccli addkey [NUMBER] [NEWSIGNINGKEYMESSAGE1] [NEWSIGNINGKEYMESSAGE2] [--logSdk] [-t next|instant]
    [-m <value> | -k <value>] [--useAccountKeySigner | --signingKey <value> | --customSignerMessage <value>]
    [--spendingKeyRequired] [--newSigningKey1 <value>] [--newSigningKey2 <value>]

ARGUMENTS
  NUMBER                 Number of spending keys to register (1 or 2)
  NEWSIGNINGKEYMESSAGE1  Message to sign to generate a new spending key to associate with a registered account.
  NEWSIGNINGKEYMESSAGE2  Message to sign to generate a new spending key to associate with a registered account.

FLAGS
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  -t, --time=<option>                 [default: next] transaction time (next is slower + cheaper)
                                      <options: next|instant>
  --customSignerMessage=<value>       Custom message to sign to derive an Aztec signing key.
  --logSdk                            verbose Aztec SDK logging
  --newSigningKey1=<value>            New signing key to associated with a registered account.
  --newSigningKey2=<value>            New signing key to associated with a registered account.
  --signingKey=<value>                An Aztec signing private key to use instead of deriving one from an Ethereum
                                      wallet.
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?
  --useAccountKeySigner               Create the Aztec signer from the account key and not a registered spending key.
                                      Use this if you have funds associated with your account key and not a spending
                                      key.

DESCRIPTION
  Add up to two spending keys to a registered account.
```

_See code: [dist/commands/addkey.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/addkey.ts)_

## `azteccli balance`

Print total balance, spendable balance associated with the privacy account and spendable balance associated with spending keys.

```
USAGE
  $ azteccli balance [--logSdk] [-m <value> | -k <value>]

FLAGS
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  --logSdk                            verbose Aztec SDK logging

DESCRIPTION
  Print total balance, spendable balance associated with the privacy account and spendable balance associated with
  spending keys.

EXAMPLES
  $ azteccli balance

  $ azteccli balance -m 'custom account key derivation message'

  $ azteccli balance --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9
```

_See code: [dist/commands/balance.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/balance.ts)_

## `azteccli defibridge AMOUNT`

Bridge assets to Ethereum base layer.

```
USAGE
  $ azteccli defibridge [AMOUNT] [--logSdk] [--time deadline|next|instant] [-a eth|dai|wsteth] [-m <value> | -k
    <value>] [--useAccountKeySigner | --signingKey <value> | --customSignerMessage <value>] [--spendingKeyRequired]

FLAGS
  -a, --asset=<option>                [default: eth]
                                      <options: eth|dai|wsteth>
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  --customSignerMessage=<value>       Custom message to sign to derive an Aztec signing key.
  --logSdk                            verbose Aztec SDK logging
  --signingKey=<value>                An Aztec signing private key to use instead of deriving one from an Ethereum
                                      wallet.
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?
  --time=<option>                     [default: deadline] transaction time (next is slower + cheaper)
                                      <options: deadline|next|instant>
  --useAccountKeySigner               Create the Aztec signer from the account key and not a registered spending key.
                                      Use this if you have funds associated with your account key and not a spending
                                      key.

DESCRIPTION
  Bridge assets to Ethereum base layer.
```

_See code: [dist/commands/defibridge.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/defibridge.ts)_

## `azteccli deposit AMOUNT`

Deposit funds to aztec.

```
USAGE
  $ azteccli deposit [AMOUNT] [--logSdk] [-r <value>] [-a eth|dai|wsteth] [-t next|instant] [-m <value> | -k
    <value>] [--spendingKeyRequired]

FLAGS
  -a, --asset=<option>                [default: eth]
                                      <options: eth|dai|wsteth>
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  -r, --recipient=<value>             Aztec Grumpkin address or registered alias
  -t, --time=<option>                 [default: next] transaction time (next is slower + cheaper)
                                      <options: next|instant>
  --logSdk                            verbose Aztec SDK logging
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?

DESCRIPTION
  Deposit funds to aztec.

EXAMPLES
  $ azteccli deposit 0.1

  $ azteccli deposit 1 --asset dai --time instant

  $ azteccli deposit 1 -a dai -t instant

  $ azteccli deposit 1 -a eth -r 0x20e4fee0dace3d58b5d30a1fcd2ec682581e92ccd1b23f9a25b007097c86cd61033293008cb23cc99c07a6c9f6e7d9edd6a46373f7f01b9e7c2b67464690066f

  $ azteccli deposit 1 -m 'custom account key derivation message'

  $ azteccli deposit 1 --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9
```

_See code: [dist/commands/deposit.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/deposit.ts)_

## `azteccli getbridges`

Get the bridges on the current network

```
USAGE
  $ azteccli getbridges [--logSdk]

FLAGS
  --logSdk  verbose Aztec SDK logging

DESCRIPTION
  Get the bridges on the current network

EXAMPLES
  aztec-cli getbridges
```

_See code: [dist/commands/getbridges.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/getbridges.ts)_

## `azteccli getfees`

Get the current tx fees

```
USAGE
  $ azteccli getfees [--logSdk] [-a eth|dai|wsteth]

FLAGS
  -a, --asset=<option>  [default: eth] The fee paying asset to fetch the fees for.
                        <options: eth|dai|wsteth>
  --logSdk              verbose Aztec SDK logging

DESCRIPTION
  Get the current tx fees

EXAMPLES
  aztec-cli getfees
```

_See code: [dist/commands/getfees.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/getfees.ts)_

## `azteccli help [COMMAND]`

Display help for azteccli.

```
USAGE
  $ azteccli help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for azteccli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.14/src/commands/help.ts)_

## `azteccli history`

Get your Aztec tx history

```
USAGE
  $ azteccli history [--logSdk] [-m <value> | -k <value>] [--json]

FLAGS
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  --logSdk                            verbose Aztec SDK logging

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Get your Aztec tx history

EXAMPLES
  $ azteccli history

  $ azteccli history -m 'custom account key derivation message'

  $ azteccli history --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9
```

_See code: [dist/commands/history.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/history.ts)_

## `azteccli plugins`

List installed plugins.

```
USAGE
  $ azteccli plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ azteccli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/index.ts)_

## `azteccli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ azteccli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ azteccli plugins:add

EXAMPLES
  $ azteccli plugins:install myplugin 

  $ azteccli plugins:install https://github.com/someuser/someplugin

  $ azteccli plugins:install someuser/someplugin
```

## `azteccli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ azteccli plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ azteccli plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/inspect.ts)_

## `azteccli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ azteccli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ azteccli plugins:add

EXAMPLES
  $ azteccli plugins:install myplugin 

  $ azteccli plugins:install https://github.com/someuser/someplugin

  $ azteccli plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/install.ts)_

## `azteccli plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ azteccli plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ azteccli plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/link.ts)_

## `azteccli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ azteccli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ azteccli plugins:unlink
  $ azteccli plugins:remove
```

## `azteccli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ azteccli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ azteccli plugins:unlink
  $ azteccli plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/uninstall.ts)_

## `azteccli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ azteccli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ azteccli plugins:unlink
  $ azteccli plugins:remove
```

## `azteccli plugins:update`

Update installed plugins.

```
USAGE
  $ azteccli plugins:update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.1/src/commands/plugins/update.ts)_

## `azteccli register [DEPOSIT]`

Register a new aztec account.

```
USAGE
  $ azteccli register [DEPOSIT] --alias <value> [--logSdk] [--ttpPubKey <value>] [--depositor <value>] [-t
    next|instant] [-a eth|dai|wsteth] [-m <value> | -k <value>] [--useAccountKeySigner | --signingKey <value> |
    --customSignerMessage <value>] [--spendingKeyRequired]

ARGUMENTS
  DEPOSIT  amount to deposit with registration (can be 0)

FLAGS
  -a, --asset=<option>                [default: eth]
                                      <options: eth|dai|wsteth>
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  -t, --time=<option>                 [default: next] transaction time (next is slower + cheaper)
                                      <options: next|instant>
  --alias=<value>                     (required) alias to register
  --customSignerMessage=<value>       Custom message to sign to derive an Aztec signing key.
  --depositor=<value>                 optional alternative ethereum depositor to pay fees if you're not paying with the
                                      account you're currently logged in with
  --logSdk                            verbose Aztec SDK logging
  --signingKey=<value>                An Aztec signing private key to use instead of deriving one from an Ethereum
                                      wallet.
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?
  --ttpPubKey=<value>                 trusted third party public key from which to generate the recovery public key
  --useAccountKeySigner               Create the Aztec signer from the account key and not a registered spending key.
                                      Use this if you have funds associated with your account key and not a spending
                                      key.

DESCRIPTION
  Register a new aztec account.

EXAMPLES
  $ azteccli register .1 --alias testooor --ttpPubKey 92b2dbc645eab72f3e3851a7d6dfb1bad170bdf444b5770644f6dd7def66ad31

  $ azteccli register --alias testooor -m 'custom account key derivation message'

  $ azteccli register --alias testooor --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'

  $ azteccli register --alias testooor --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241
```

_See code: [dist/commands/register.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/register.ts)_

## `azteccli transfer AMOUNT`

Transfer funds on the Aztec network.

```
USAGE
  $ azteccli transfer [AMOUNT] -r <value> [--logSdk] [-a eth|dai|wsteth] [-t next|instant] [-m <value> | -k
    <value>] [--useAccountKeySigner | --signingKey <value> | --customSignerMessage <value>] [--spendingKeyRequired]

FLAGS
  -a, --asset=<option>                [default: eth]
                                      <options: eth|dai|wsteth>
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  -r, --recipient=<value>             (required) Aztec Grumpkin address or registered alias
  -t, --time=<option>                 [default: next] transaction time (next is slower + cheaper)
                                      <options: next|instant>
  --customSignerMessage=<value>       Custom message to sign to derive an Aztec signing key.
  --logSdk                            verbose Aztec SDK logging
  --signingKey=<value>                An Aztec signing private key to use instead of deriving one from an Ethereum
                                      wallet.
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?
  --useAccountKeySigner               Create the Aztec signer from the account key and not a registered spending key.
                                      Use this if you have funds associated with your account key and not a spending
                                      key.

DESCRIPTION
  Transfer funds on the Aztec network.

EXAMPLES
  $ azteccli transfer 0.1 -r theiralias

  $ azteccli transfer 1 -r 0x20e4fee0dace3d58b5d30a1fcd2ec682581e92ccd1b23f9a25b007097c86cd61033293008cb23cc99c07a6c9f6e7d9edd6a46373f7f01b9e7c2b67464690066f

  $ azteccli transfer 1 -r theiralias --time instant --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'

  $ azteccli transfer 1 -r theiralias --asset dai --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241
```

_See code: [dist/commands/transfer.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/transfer.ts)_

## `azteccli withdraw [AMOUNT]`

Withdraw funds from the Aztec network.

```
USAGE
  $ azteccli withdraw [AMOUNT] -r <value> [--logSdk] [-a eth|dai|wsteth] [-t next|instant] [-m <value> | -k
    <value>] [--useAccountKeySigner | --signingKey <value> | --customSignerMessage <value>] [--spendingKeyRequired]

FLAGS
  -a, --asset=<option>                [default: eth]
                                      <options: eth|dai|wsteth>
  -k, --accountKey=<value>            An Aztec account private key to use instead of deriving one from an Ethereum
                                      wallet.
  -m, --customAccountMessage=<value>  Custom message to sign to derive an Aztec account key
  -r, --recipient=<value>             (required) Ethereum account address to withdraw to.
  -t, --time=<option>                 [default: next] transaction time (next is slower + cheaper)
                                      <options: next|instant>
  --customSignerMessage=<value>       Custom message to sign to derive an Aztec signing key.
  --logSdk                            verbose Aztec SDK logging
  --signingKey=<value>                An Aztec signing private key to use instead of deriving one from an Ethereum
                                      wallet.
  --spendingKeyRequired               Should the recipient be required to have a registered spending key?
  --useAccountKeySigner               Create the Aztec signer from the account key and not a registered spending key.
                                      Use this if you have funds associated with your account key and not a spending
                                      key.

DESCRIPTION
  Withdraw funds from the Aztec network.

EXAMPLES
  $ azteccli withdraw 0.1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB

  $ azteccli withdraw 1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241

  $ azteccli withdraw 1 -r 0x2e782B05290A7fFfA137a81a2bad2446AD0DdFEB --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'
```

_See code: [dist/commands/withdraw.ts](https://github.com/critesjosh/azteccli/blob/v0.0.19/dist/commands/withdraw.ts)_
<!-- commandsstop -->
