import { ethers } from "ethers";
import REXTokenABI from "../contracts/REXToken.json";

// TODO: Replace this with the actual deployed contract address
export const REXTokenAddress = "0x0000000000000000000000000000000000000000";

export const getREXTokenContract = (signerOrProvider) => {
    return new ethers.Contract(REXTokenAddress, REXTokenABI, signerOrProvider);
};
