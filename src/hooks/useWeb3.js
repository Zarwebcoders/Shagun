import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getREXTokenContract } from "../config/web3Config";

export const useWeb3 = () => {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState("0");

    const fetchBalance = async (userAccount, userContract) => {
        if (!userAccount || !userContract) return;
        try {
            const bal = await userContract.balanceOf(userAccount);
            setBalance(ethers.formatEther(bal));
        } catch (err) {
            console.error("Error fetching balance:", err);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install it to use this app.");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);

            if (accounts.length > 0) {
                const signer = await provider.getSigner();
                const contractInstance = getREXTokenContract(signer);

                setProvider(provider);
                setAccount(accounts[0]);
                setContract(contractInstance);
                setIsConnected(true);
                setError(null);

                await fetchBalance(accounts[0], contractInstance);

                console.log("Wallet connected:", accounts[0]);
                console.log("Contract instance created:", contractInstance);
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
            setError("Failed to connect wallet. Please try again.");
        }
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();

                    if (accounts.length > 0) {
                        const signer = await provider.getSigner();
                        const contractInstance = getREXTokenContract(signer);
                        const userAccount = accounts[0].address;

                        setProvider(provider);
                        setAccount(userAccount);
                        setContract(contractInstance);
                        setIsConnected(true);

                        await fetchBalance(userAccount, contractInstance);
                    }
                } catch (err) {
                    console.error("Error checking connection:", err);
                }
            }
        };

        checkConnection();

        if (window.ethereum) {
            const handleAccountsChanged = async (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    if (contract) {
                        await fetchBalance(accounts[0], contract);
                    }
                } else {
                    setAccount(null);
                    setIsConnected(false);
                    setBalance("0");
                }
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, [contract]);

    return { account, contract, provider, isConnected, connectWallet, error, balance, fetchBalance };
};
