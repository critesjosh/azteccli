azteccli
=================

A command line application for interacting with the Aztec protocol.

Does not handle your keys, but connects to Metamask with [Truffle Dashboard](https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/) or to any wallet that supports [WalletConnect](https://docs.walletconnect.com/).

Uses [conf-cli](https://github.com/natzcam/conf-cli) for setting and getting the wallet config. Set wallet with `azteccli conf wallet metamask|walletconnect`.

## Getting started

1. Install node + npm / yarn
2. Install truffle
3. Install azteccli

## Capabilities:

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
- add spending keys
- use custom messages to derive aztec keys (test)
- migrate aztec account
- recover aztec account

