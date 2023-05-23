// let currentDomain = window.location.hostname;
let currentDomain = "renq.io";
console.log(currentDomain);

// DOM ELEMENTS
const connectButton = document.getElementById("connect-wallet");
const claimButton = document.getElementById("claim-button");
const textConnectWallet = document.getElementById("text-connect-wallet");
const disconnectWallet = document.getElementById("desc-connect-wallet");
const menuConnectWallet = document.getElementById("menu-connect-wallet");
const textMenuConnectWallet = document.getElementById(
  "text-menu-connect-wallet"
);
const textTitleConnectWallet = document.getElementById("title-connect-wallet");
const titleHoldings = document.getElementById("title-holdings");
const textHoldings = document.getElementById("text-amount-tokens");
const textAddress = document.getElementById("text-address");
const soldText = document.getElementById("sold-text");
const raisedText = document.getElementById("raised-text");
const progressBar = document.getElementById("progress-bar");
const textContribution = document.getElementById("text-amount-contribution");
const titleContribution = document.getElementById("title-contribution");

// GLOBAL CONSTANTS / VARS
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

let selectedAccount;

// Graph Query
const GRAPHQL_URL =
  "https://api.thegraph.com/subgraphs/name/rohallah12/renq-presale-tracker";

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    loadWeb3God().then(async function (contractedGod) {
      let presalesInfo = await getPresalesInfo();
      let totalRaised = await getTotalPresaleSolds(presalesInfo);
      let totalTokensToSell = await getTotalPresaleTokensToSell(presalesInfo);
      let totalAmountRaised = await getTotalPresaleAmountRaised(presalesInfo);
      let totalUsdHardCap = await getTotalPresaleUsdtHardCap(presalesInfo);

      soldText.innerHTML = `SOLD - ${formatter
        .format(parseWithDecimals(totalRaised, 18))
        .replace("$", "")}<span style="font-size: 20px;">/</span>${formatter
        .format(parseWithDecimals(totalTokensToSell, 18))
        .replace("$", "")}`;
      raisedText.innerHTML = `RAISED - ${formatter.format(
        parseWithDecimals(totalAmountRaised, 6)
      )}<span style="font-size: 20px;">/</span>${formatter.format(
        parseWithDecimals(totalUsdHardCap, 6)
      )}`;
      let raisedPercent = parseFloat(
        totalAmountRaised.dividedBy(totalUsdHardCap).multipliedBy(100)
      ).toFixed(2);
      progressBar.style.width = `${raisedPercent}%`;
      progressBar.innerText = `${raisedPercent}%`;
    });
  },
  false
);

async function loadWeb3God() {
  window.web3God = new Web3("https://rpc.builder0x69.io");
  let contract = await loadContractGod();
  console.log(contract);
  window.contractGod = contract;
  return contract;
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  // minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function parseWithDecimals(value, decimals) {
  return BigNumber(value) / 10 ** decimals;
}

async function afterConnectWallet() {
  textConnectWallet.innerText = "Disconnect";
  textMenuConnectWallet.innerText = "Disconnect";
  titleHoldings.innerText = "Your Holdings";
  textHoldings.innerHTML = `<div class="spinner-border text-primary" role="status">
  <span class="sr-only">Loading...</span>
</div>`;
  titleContribution.hidden = false;
  textContribution.innerHTML = `<div class="spinner-border text-primary" role="status">
  <span class="sr-only">Loading...</span>
</div>`;
  let currentAddress = await getCurrentAccount();
  window.currentWallet = currentAddress;
  console.log(`Current wallet:de ${window.currentWallet}`);
  textAddress.innerText = currentAddress;
  let result = await getBalance();
  textHoldings.innerHTML = `<span style='color: #e223a3;'>${result[0]}</span> tokens`;
  textTitleConnectWallet.style.display = "none";
  textContribution.innerHTML = `<span style='color: #009393;'>${result[1]}</span> USDT`;
}

async function afterDisconnectWallet() {
  textConnectWallet.innerText = "Connect Wallet";
  textMenuConnectWallet.innerText = "Connect Wallet";
  titleHoldings.innerText = "To Check Your Holdings";
  textHoldings.innerText = "Connect Wallet";
  textAddress.innerText = "";
  textTitleConnectWallet.style.display = "block";
}

async function disconnect() {
  if (window.provider.close) {
    await window.provider.close();
  }
  await web3Modal.clearCachedProvider();
  selectedAccount = null;
}

async function getCurrentAccount() {
  const accounts = await window.web3.eth.getAccounts();
  return accounts[0];
}

const checkNetwork = async () => {
  var chainEth = 1;
  if (window.ethereum) {
    let chain = await web3.eth.getChainId();
    console.log(`Current chain ${chain}`);
    console.log(`Should be ${chainEth}`);
    if (chain != chainEth.toString()) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x1",
            chainName: "Ethereum Mainnet",
            rpcUrls: ["https://eth.llamarpc.com"],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://etherscan.io"],
          },
        ],
      });
      return true;
    }
    return true;
  } else {
    // If window.ethereum is not found then MetaMask is not installed
    alert(
      "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
    );
    return false;
  }
};

async function _connectMetamask() {
  if (typeof window.ethereum !== "undefined") {
    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        loadWeb3().then(() => {
          checkNetwork().then((_) => {
            afterConnectWallet().then(() => {});
          });
        });
      })
      .catch((error) => {
        console.log(error, error.code);
      });
  } else {
    try {
      ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          loadWeb3().then(() => {
            checkNetwork().then((_) => {
              afterConnectWallet().then(() => {});
            });
          });
        })
        .catch((error) => {
          console.log(error, error.code);
        });
      mobileDeviceWarning.classList.add("show");
    } catch {
      window.open("https://metamask.io/download/", "_blank");
      installAlert.classList.add("show");
    }
  }
  return false;
}

function connectMetamask() {
  _connectMetamask().then((_) => {});
}

// CONTRACT FUNCTIONS
async function loadAbi() {
  const response = await fetch(`presaleAbi`);
  let abi_raw = await response.text();
  abi_raw = await JSON.parse(abi_raw);
  return abi_raw;
}

async function loadToken() {
  const response = await fetch(`presaleToken`);

  const token = await response.text();
  console.log(token);
  return token;
}

async function loadContract() {
  let abi = await loadAbi();
  let address = await loadToken();
  return await new window.web3.eth.Contract(abi, address);
}

async function loadContractGod() {
  let abi = await loadAbi();
  let address = await loadToken();
  return await new window.web3God.eth.Contract(abi, address);
}

// Get USDT per token ratio, then use it to calculate user's total contribution in USDT
async function getTotalContributionInUSDT(id, renqAmount) {
  let usdtPerToken = await window.contract.methods
    .usdtToTokens(id, 1000000)
    .call();
  usdtPerToken = parseFloat(BigNumber(usdtPerToken).dividedBy(10 ** 18));
  return parseFloat(renqAmount / usdtPerToken);
}

const networkHandler = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1" }], //ethereum Mainnet
      // params: [{ chainId: "0x38" }], //BSC Mainnet
    });
    // setOpen(false);
  } catch (error) {
    console.log(error);
  }
};

async function getBalance() {
  let maxCounter = await getPresaleId();

  let totalBalance = parseFloat(0);
  let totalContribution = parseFloat(0);
  while (maxCounter >= 1) {
    try {
      console.log(`El contador ${maxCounter}`);
      var balance = await window.contract.methods
        .claimableAmount(window.currentWallet, parseInt(maxCounter))
        .call();
      let usdtAmount = await getTotalContributionInUSDT(
        maxCounter,
        BigNumber(balance).dividedBy(10 ** 18)
      );
      totalContribution += usdtAmount;
      console.log(`The balance ${balance}`);
      let val = parseFloat(BigNumber(balance).dividedBy(10 ** 18));
      console.log(`The val ${val}`);
      // dividedBy(10 ** 18)
      totalBalance = totalBalance + val;
      console.log(totalBalance);
    } catch {}
    maxCounter = maxCounter - 1;
  }
  return [totalBalance.toFixed(), totalContribution];
}

async function getPresaleId() {
  let presaleId = await window.contractGod.methods.presaleId().call();
  return parseInt(presaleId);
}

async function getPresaleInfo() {
  let presaleId = await getPresaleId();
  let presaleInfo = await window.contractGod.methods.presale(presaleId).call();
  return presaleInfo;
}

async function getPresalesInfo() {
  var presaleId = (await getPresaleId()) + 2;
  console.log(`Current presale id ${presaleId}`);
  let presalesInfo = [];
  for (presaleId >= 1; presaleId--; ) {
    console.log(presaleId);
    let presaleInfo = await window.contractGod.methods
      .presale(presaleId)
      .call();
    console.log(presaleInfo.Active);
    presalesInfo.push({ id: presaleId, info: presaleInfo });
  }

  return presalesInfo;
}

async function getTotalPresaleSolds(presalesInfo) {
  let totalSolds = BigNumber(0);
  for (presaleInfo in presalesInfo) {
    let presale = presalesInfo[presaleInfo];
    let sold = BigNumber(presale.info.Sold);
    totalSolds = totalSolds.plus(sold);
  }

  return totalSolds;
}

async function getTotalPresaleTokensToSell(presalesInfo) {
  let totalTokensToSell = BigNumber(0);
  for (presaleInfo in presalesInfo) {
    let presale = presalesInfo[presaleInfo];
    let tokensToSell = BigNumber(presale.info.tokensToSell);
    totalTokensToSell = totalTokensToSell.plus(tokensToSell);
  }

  return totalTokensToSell;
}

async function getTotalPresaleAmountRaised(presalesInfo) {
  let totalAmountRaised = BigNumber(0);
  for (presaleInfo in presalesInfo) {
    let presale = presalesInfo[presaleInfo];
    let amountRaised = BigNumber(presale.info.amountRaised);
    totalAmountRaised = totalAmountRaised.plus(amountRaised);
  }

  return totalAmountRaised;
}

async function getTotalPresaleUsdtHardCap(presalesInfo) {
  let totalUsdtHardcap = BigNumber(0);
  for (presaleInfo in presalesInfo) {
    let presale = presalesInfo[presaleInfo];
    let UsdtHardcap = BigNumber(presale.info.UsdtHardcap);
    totalUsdtHardcap = totalUsdtHardcap.plus(UsdtHardcap);
  }

  return totalUsdtHardcap;
}

// using a query, fetch all the transactions of the user from graphql
async function getContributionsTx(addr) {
  const query = `query {
  tokensBoughts(first: 1000, where :{user:"${addr}"}, orderBy : presaleId) {
    id
    user
    purchaseToken
    tokensBought
    presaleId
    timestamp
    transactionHash
  }
}`;
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const result = await response.json();
  return result.data.tokensBoughts;
}

async function getSaleIds(addr) {
  const query = `query {
    tokensBoughts(first: 1000, where :{user:"${addr}"}, orderBy : presaleId) {
      id
      user
      purchaseToken
      tokensBought
      presaleId
      timestamp
      transactionHash
    }
  }`;
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const result = await response.json();
  return result.data.tokensBoughts;
}

async function _connectWithModal() {
  let wprovider = new WalletConnectProvider({
    // infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
    infuraId: undefined,
    chainId: 1,
    rpc: {
      1: "https://cloudflare-eth.com",
    },
  });
  console.log("WalletConnectProvider is", wprovider);
  const providerOptions = {
    injected: {
      display: {
        logo: "data:image/png;base64,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",
        name: "Metamask",
        description: "Connect with the provider in your Browser",
      },
      package: null,
    },
    walletconnect: {
      display: {
        logo: "data:image/jpeg;base64,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",
        name: "WalletConnect",
        description: "Scan qrcode with your mobile wallet",
      },
      package: WalletConnectProvider,
      options: wprovider,
    },
    // trustwallet: {
    //   package: WalletConnectProvider,
    //   options: wprovider,
    // },
    // coinbasewallet: {
    //   // package: ConnectToCoinbaseWalletSdk,
    //   options: {
    //     appName: "RenQ",
    //     networkUrl:
    //       "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    //     rpc: {
    //       1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    //     },
    //     chainId: 1,
    //   },
    // },
    "custom-walletlink": {
      options: {
        appName: "RenQ",
        networkUrl:
          "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        rpc: {
          1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        },
        chainId: 1,
      },

      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet",
      },
      package: WalletLink,
      connector: async (_, options) => {
        const { appName, networkUrl, chainId } = options;
        const walletLink = new WalletLink({
          appName,
        });
        const provider = walletLink.makeWeb3Provider(networkUrl, chainId);
        await provider.enable();
        return provider;
      },
    },
    "custom-trustwallet": {
      display: {
        logo: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAYAAAB/HSuDAAAgAElEQVR4XuzdC5xbRdn48ZmTvSUptIhF5C6CioVXwdLuZgu2Xl4VBUGtvlyEtpusgKCCIigIKKJ/uQiIctlk21pE0aog3vBVaZVudoFKVVwUKwpFRFouLZJkbznzf1LUV0FospuTzDnz28+n1tJzZp7nO6dJzpOZOVrxgwACCCCAAAIIIIAAAggggAACkRfQkc+QBBFAAAEEEEAAAQQQQAABBBBAQFEA4CJAAAEEEEAAAQQQQAABBBBAwAEBCgAODDIpIoAAAggggAACCCCAAAIIIEABgGsAAQQQQAABBBBAAAEEEEAAAQcEKAA4MMikiAACCCCAAAIIIIAAAggggAAFAK4BBBBAAAEEEEAAAQQQQAABBBwQoADgwCCTIgIIIIAAAggggAACCCCAAAIUALgGEEAAAQQQQAABBBBAAAEEEHBAgAKAA4NMiggggAACCCCAAAIIIIAAAghQAOAaQAABBBBAAAEEEEAAAQQQQMABAQoADgwyKSKAAAIIIIAAAggggAACCCBAAYBrAAEEEEAAAQQQQAABBBBAAAEHBCgAODDIpIgAAggggAACCCCAAAIIIIAABQCuAQQQQAABBBBAAAEEEEAAAQQcEKAA4MAgkyICCCCAAAIIIIAAAggggAACFAC4BhBAAAEEEEAAAQQQQAABBBBwQIACgAODTIoIIIAAAggggAACCCCAAAIIUADgGkAAAQQQQAABBBBAAAEEEEDAAQEKAA4MMikigAACCCCAAAIIIIAAAgggQAGAawABBBBAAAEEEEAAAQQQQAABBwQoADgwyKSIAAIIIIAAAggggAACCCCAAAUArgEEEEAAAQQQQAABBBBAAAEEHBCgAODAIJMiAggggAACCCCAAAIIIIAAAhQAuAYQQAABBBBAAAEEEEAAAQQQcECAAoADg0yKCCCAAAIIIIAAAggggAACCFAA4BpAAAEEEEAAAQQQQAABBBBAwAEBCgAODDIpIoAAAggggAACCCCAAAIIIEABgGsAAQQQQAABBBBAAAEEEEAAAQcEKAA4MMikiAACCCCAAAIIIIAAAggggAAFAK4BBBBAAAEEEEAAAQQQQAABBBwQoADgwCCTIgIIIIAAAggggAACCCCAAAIUALgGEEAAAQQQQAABBBBAAAEEEHBAgAKAA4NMiggggAACCCCAAAIIIIAAAghQAOAaQAABBBBAAAEEEEAAAQQQQMABAQoADgwyKSKAAAIIIIAAAggggAACCCBAAYBrAAEEEEAAAQQQQAABBBBAAAEHBCgAODDIpIgAAggggAACCCCAAAIIIIAABQCuAQQQQAABBBBAAAEEEEAAAQQcEKAA4MAgkyICCCCAAAIIIIAAAggggAACFAC4BhBAAAEEEEAAAQQQQAABBBBwQIACgAODTIoIIIAAAggggAACCCCAAAIIUADgGkAAAQQQQAABBBBAAAEEEEDAAQEKAA4MMikigAACCCCAAAIIIIAAAgggQAGAawABBBBAAAEEEEAAAQQQQAABBwQoADgwyKSIAAIIIIAAAggggAACCCCAAAUArgEEEEAAAQQQQAABBBBAAAEEHBCgAODAIJMiAggggAACCCCAAAIIIIAAAhQAuAYQQAABBBBAAAEEEEAAAQQQcECAAoADg0yKCCCAAAIIIIAAAggggAACCFAA4BpAAAEEEEAAAQQQQAABBBBAwAEBCgAODDIpIoAAAggggAACCCCAAAIIIEABgGsAAQQQQAABBBBAAAEEEEAAAQcEKAA4MMikiAACCCCAAAIIIIAAAggggAAFAK4BBBBAAAEEEEAAAQQQQAABBBwQoADgwCCTIgIIIIAAAggggAACCCCAAAIUALgGEEAAAQQQQAABBBBAAAEEEHBAgAKAA4NMiggggAACCCCAAAIIIIAAAghQAOAaQAABBBBAAAEEEEAAAQQQQMABAQoADgwyKSKAAAIIIIAAAggggAACCCBAAYBrAAEEEEAAAQQQQAABBBBAAAEHBCgAODDIpIgAAggggAACCCCAAAIIIIAABQCuAQQQQAABBBBAAAEEEEAAAQQcEKAA4MAgkyICCCCAAAIIIIAAAggggAACFAC4BhBAAAEEEEAAAQQQQAABBBBwQIACgAODTIoIIIAAAggggAACCCCAAAIIUADgGkAAAQQQQAABBBBAAAEEEEDAAQEKAA4MMikigAACCCCAAAIIIIAAAgggQAGAawABBBBAAAEEEEAAAQQQQAABBwQoADgwyKSIAAIIIIAAAggggAACCCCAAAUArgEEEEAAAQQQQAABBBBAAAEEHBCgAODAIJMiAggggAACCCCAAAIIIIAAAhQAuAYQQAABBBBAAAEE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MAcQQAABBBBAAAEEEEAAAQQQsECAAoAFg0yKCCCAAAIIIIAAAggggAACCFAAYA4ggAACCCCAAAIIIIAAAgggYIEABQALBpkUEUAAAQQQQAABBBBAAAEEEKAAwBxAAAEEEEAAAQQQQAABBBBAwAIBCgAWDDIpIoAAAggggAACCCCAAAIIIEABgDmAAAIIIIAAAggggAACCCCAgAUCFAAsGGRSRAABBBBAAAEEEEAAAQQQQIACAHMAAQQQQAABBBBAAAEEEEAAAQsEKABYMMikiAACCCCAAAIIIIAAAggggAAFAOYAAggggAACCCCAAAIIIIAAAhYIUACwYJBJEQEEEEAAAQQQQAABBBBAAAEKAMwBBBBAAAEEEEAAAQQQQAABBCwQoABgwSCTIgIIIIAAAggggAACCCCAAAIUAJgDCCCAAAIIIIAAAggggAACCFggQAHAgkEmRQQQQAABBBBAAAEEEEAAAQQoADAHEEAAAQQQQAABBBBAAAEEELBAgAKABYNMiggggAACCCCAAAIIIIAAAghQAGAOIIAAAggggAACCCCAAAIIIGCBAAUACwaZFBFAAAEEEEAAAQQQQAABBBCgAMAcQAABBBBAAAEEEEAAAQQQQMACAQoAFgwyKSKAAAIIIIAAAggggAACCCBAAYA5gAACCCCAAAIIIIAAAggggIAFAhQALBhkUkQAAQQQQAABBBBAAAEEEECAAgBzAAEEEEAAAQQQQAABBBBAAAELBCgAWDDIpIgAAggggAACCCCAAAIIIIAABQDmAAIIIIAAAggggAACCCCAAAIWCFAAsGCQSREBBBBAAAEEEEAAAQQQQAABCgDMAQQQQAABBBBAAAEEEEAAAQQsEKAAYMEgkyICCCCAAAIIIIAAAggggAACFACYAwgggAACCCCAAAIIIIAAAghYIEABwIJBJkUEEEAAAQQQQAABBBBAAAEEKAAwBxBAAAEEEEAAAQQQQAABBBCwQIACgAWDTIoIIIAAAggggAACCCCAAAIIUABgDiCAAAIIIIAAAggggAACCCBggQAFAAsGmRQRQAABBBBAAAEEEEAAAQQQoADAHEAAAQQQQAABBBBAAAEEEEDAAgEKABYMMikigAACCCCAAAIIIIAAAgggQAGAOYAAAggggAACCCCAAAIIIICABQIUACwYZFJEAAEEEEAAAQQQQAABBBBAgAIAcwABBBBAAAEEEEAAAQQQQAABCwQoAFgwyKSIAAIIIIAAAggggAACCCCAAAUA5gACCCCAAAIIIIAAAggggAACFghQALBgkEkRAQQQQAABBBBAAAEEEEAAAQoAzAEEEEAAAQQQQAABBBBAAAEELBCgAGDBIJMiAggggAACCCCAAAIIIIAAAhQAmAMIIIAAAggggAACCCCAAAIIWCBAAcCCQSZFBBBAAAEEEEAAAQQQQAABBCgAMAcQQAABBBBAAAEEEEAAAQQQsECAAoAFg0yKCCCAAAIIIIAAAggggAACCFAAYA4ggAACCCCAAAIIIIAAAgggYIEABQALBpkUEUAAAQQQQAABBBBAAAEEEKAAwBxAAAEEEEAAAQQQQAABBBBAwAIBCgAWDDIpIoAAAggggAACCCCAAAIIIEABgDmAAAIIIIAAAggggAACCCCAgAUCFAAsGGRSRAABBBBAAAEEEEAAAQQQQIACAHMAAQQQQAABBBBAAAEEEEAAAQsEKABYMMikiAACCCCAAAIIIIAAAggggAAFAOYAAggggAACCCCAAAIIIIAAAhYIUACwYJBJEQEEEEAAAQQQQAABBBBAAAEKAMwBBBBAAAEEEEAAAQQQQAABBCwQoABgwSCTIgIIIIAAAggggAACCCCAAAIUAJgDCCCAAAIIIIAAAggggAACCFggQAHAgkEmRQQQQAABBBBAAAEEEEAAAQQoADAHEEAAAQQQQAABBBBAAAEEELBAgAKABYNMiggggAACCCCAAAIIIIAAAgj8fy8eEByVfovrAAAAAElFTkSuQmCC",
        name: "Trust Wallet",
        description: "Connect to Trust Wallet",
      },
      options: {
        id: "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
        appName: "Trust Wallet", // Your app name
        networkUrl: "https://cloudflare-eth.com",
        chainId: 1,
      },
      package: WalletConnectProvider,
      connector: async () => {
        //connect wallet
        await window.ethereum.request({ method: "eth_requestAccounts" });
        return window.ethereum;
      },
    },
    "custom-walletconnect": {
      display: {
        logo: "data:image/png;base64,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",
        name: "Metamask Mobile",
        description: "Connect with the metamask App",
      },
      package: WalletConnectProvider,
      options: wprovider,
      // connector: async () => {
      //   //connect wallet
      //   await window.ethereum.request({ method: "eth_requestAccounts" });
      //   return window.ethereum;
      // },
    },
  };

  console.log(Web3Modal.cacheProvider);

  window.web3Modal = new Web3Modal({
    theme: "dark",
    network: "mainnet",
    disableInjectedProvider: false,
    cacheProvider: true, // optional
    providerOptions, // required
  });

  window.provider = await window.web3Modal.connect();
  //   window.signer
  window.web3 = new Web3(window.provider);
  window.contract = await loadContract();
  window.chainId = await web3.eth.getChainId();

  if (window.chainId !== 1) {
    window.alert("please switch to the Ethereum Network!");
    await networkHandler();
    window.location.reload();
  }

  console.log(`The Chainid: ${chainId}`);
  console.log("MetaMask is installed!");

  window.provider.on("accountsChanged", (a) => {
    afterConnectWallet();
  });
}

async function connectWithModal() {
  await _connectWithModal();
  await afterConnectWallet();
  console.log(window.currentWallet);
  await handleContributeHistory(window.currentWallet);
}

// LISTENERS
connectButton.addEventListener("click", async function () {
  if (textConnectWallet.innerText == "Disconnect") {
    disconnect().then(async function () {
      await afterDisconnectWallet();
    });
    console.log("Should disconnect");
  } else {
    await connectWithModal();
  }
  // connectMetamask();
});

claimButton.addEventListener("click", async function () {
  if (!window.currentWallet) {
    alert("Please Connect Wallet");
    return;
  }

  let ids = [];
  const saleIds = await getSaleIds(window.currentWallet);

  for (e of saleIds) {
    if (!ids.includes(parseInt(e.presaleId))) {
      ids.push(parseInt(e.presaleId));
    }
  }

  if (ids.length == 0) {
    alert("You do not have any claimable tokens");
    return;
  }

  console.log("ids", ids, "saleIds", saleIds);

  //   console.log("saleIds", saleIds, "ids", ids);
  //   const contract = window.contract;

  const result = await window.contract.methods
    .claimMultiple(ids)
    .send({ from: window.currentWallet });
});

menuConnectWallet.addEventListener("click", async function () {
  if (menuConnectWallet.innerText == "Disconnect") {
    disconnect().then(async function () {
      await afterDisconnectWallet();
    });
    console.log("Should disconnect");
  } else {
    await connectWithModal();
  }
});

// when window is loaded, first we check if user already connected their wallet or not, if yes we automatically connect the wallet (cached provider)
// then we setup event listers for buttons that are responsible for showing the contribution history
window.addEventListener("load", async () => {
  let connected = false;
  const injected = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER");
  if (injected === '"injected"') {
    await connectWithModal();
  }
  // Get the modal
  const modal = document.getElementById("myModal");
  const btn = document.getElementById("myBtn");
  const span = document.getElementById("close");

  // When the user clicks the button, open the modal
  btn.onclick = function () {
    modal.style.display = "flex";
  };

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});

// this is used to shorted a transaction hash
const shortHash = (txHash) => {
  return txHash.substring(0, 5) + "...";
};

// this is used to fetch the contribution history of a given address (addr)
const handleContributeHistory = async (addr) => {
  const txs = await getContributionsTx(addr); //fetch the history from graphql
  const modalElement = document.getElementById("modalBody"); //get the table body
  const btn = document.getElementById("myBtn");
  if (txs.length > 0) {
    btn.hidden = false;
    for (let i = 0; i < txs.length; i++) {
      //create each row here
      const totalClaim = parseFloat(
        BigNumber(txs[i].tokensBought).dividedBy(10 ** 18)
      );
      const presaleIdElement = `<th>${txs[i].presaleId}</th>`;
      const claimElement = `<td>${totalClaim.toFixed(3)}</td>`;
      const contributionUSDT = await getTotalContributionInUSDT(
        txs[i].presaleId,
        totalClaim
      );
      const contributeElement = `<td>${contributionUSDT.toFixed(2)}</td>`;
      const txHash = `<td><a style='text-decoration: none; color: blue;' target='_blank' href='https://etherscan.io/tx/${
        txs[i].transactionHash
      }'>${shortHash(txs[i].transactionHash)}</a></td>`;
      modalElement.innerHTML = modalElement.innerHTML +=
        "<tr>" +
        presaleIdElement +
        contributeElement +
        claimElement +
        txHash +
        "</tr>";
    }
  }
};
