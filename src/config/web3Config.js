import { ethers } from "ethers";
import REXTokenABI from "../contracts/REXToken.json";

// TODO: Replace this with the actual deployed contract address
export const REXTokenAddress = "0x8385de2e557A90bc64e22B210ae55F00EFf488d7";

export const getREXTokenContract = (signerOrProvider) => {
    return new ethers.Contract(REXTokenAddress, REXTokenABI, signerOrProvider);
};
