type NetworkInfo = {
  rollupProvider: string;
  explorerUrl: string;
};

type Config = {
  [index: number]: NetworkInfo;
};

let networkConfig: Config = {
  1: {
    rollupProvider: "https://api.aztec.network/aztec-connect-prod/falafel",
    explorerUrl: "https://aztec-connect-prod-explorer.aztec.network/",
  },
  3567: {
    rollupProvider: "http://localhost:8081",
    explorerUrl: "",
  },
  677868: {
    rollupProvider: "https://api.aztec.network/aztec-connect-testnet/falafel/",
    explorerUrl: "https://aztec-connect-testnet-explorer.aztec.network/",
  },
};

export default networkConfig;
