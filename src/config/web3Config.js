import { ethers } from "ethers";
import REXTokenABI from "../contracts/REXToken.json";

// Polygon Mainnet Config
export const POLYGON_NETWORK_CONFIG = {
    chainId: "0x89", // 137 in hex
    chainName: "Polygon Mainnet",
    nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18
    },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"]
};

export const EXPECTED_CHAIN_ID = 137;

// TODO: Replace this with the actual deployed contract address
export const REXTokenAddress = "0x8385de2e557A90bc64e22B210ae55F00EFf488d7";

export const getREXTokenContract = (signerOrProvider) => {
    return new ethers.Contract(REXTokenAddress, REXTokenABI, signerOrProvider);
};
