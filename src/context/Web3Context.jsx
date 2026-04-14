import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getREXTokenContract } from "../config/web3Config";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState("0");
    const [stakedBalance, setStakedBalance] = useState("0");

    const fetchBalance = useCallback(async (userAccount, userContract) => {
        if (!userAccount || !userContract) return;
        try {
            const bal = await userContract.balanceOf(userAccount);
            setBalance(ethers.formatEther(bal));

            // Fetch staked balance
            const stakeInfo = await userContract.getStakeInfo(userAccount);
            setStakedBalance(ethers.formatEther(stakeInfo.stakedAmount));
        } catch (err) {
            console.error("Error fetching balance:", err);
        }
    }, []);

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
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
            setError("Failed to connect wallet. Please try again.");
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setContract(null);
        setProvider(null);
        setIsConnected(false);
        setBalance("0");
        setStakedBalance("0");
        console.log("Wallet disconnected");
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
                    const newAddress = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address;
                    setAccount(newAddress);
                } else {
                    disconnectWallet();
                }
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, [fetchBalance]);

    return (
        <Web3Context.Provider value={{ 
            account, 
            contract, 
            provider, 
            isConnected, 
            connectWallet, 
            disconnectWallet, 
            error, 
            balance, 
            stakedBalance, 
            fetchBalance 
        }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3Context = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error("useWeb3Context must be used within a Web3Provider");
    }
    return context;
};
