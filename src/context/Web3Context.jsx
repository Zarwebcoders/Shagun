import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getREXTokenContract, EXPECTED_CHAIN_ID, POLYGON_NETWORK_CONFIG } from "../config/web3Config";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState("0");
    const [stakedBalance, setStakedBalance] = useState("0");
    const [miningBonus, setMiningBonus] = useState("0");
    const [miningSlots, setMiningSlots] = useState(0);

    const fetchBalance = useCallback(async (userAccount, userContract) => {
        if (!userAccount || !userContract) return;
        try {
            const bal = await userContract.balanceOf(userAccount);
            setBalance(ethers.formatEther(bal));

            // Fetch staked balance using getStakedTokens (synchronized with source)
            const staked = await userContract.getStakedTokens(userAccount);
            setStakedBalance(ethers.formatEther(staked));

            // Fetch mining rewards
            const rewards = await userContract.getTotalMiningRewards(userAccount);
            setMiningBonus(ethers.formatEther(rewards));

            // Fetch mining slots
            const slots = await userContract.getMiningSlotsCompleted(userAccount);
            setMiningSlots(Number(slots));
        } catch (err) {
            console.error("Error fetching balance:", err);
            if (err.code === 'BAD_DATA' || err.message.includes('could not decode')) {
                setError("Network mismatch: Contract not found on this network. Please switch to Polygon.");
            }
        }
    }, []);

    const switchNetwork = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: POLYGON_NETWORK_CONFIG.chainId }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [POLYGON_NETWORK_CONFIG],
                    });
                } catch (addError) {
                    console.error("Failed to add network:", addError);
                }
            }
            console.error("Failed to switch network:", switchError);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install it to use this app.");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
                await switchNetwork();
                // Re-check after switch attempt
                const newNetwork = await provider.getNetwork();
                if (Number(newNetwork.chainId) !== EXPECTED_CHAIN_ID) {
                    setError(`Please switch to ${POLYGON_NETWORK_CONFIG.chainName}`);
                    return;
                }
            }

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
                    const network = await provider.getNetwork();
                    const accounts = await provider.listAccounts();

                    if (accounts.length > 0 && Number(network.chainId) === EXPECTED_CHAIN_ID) {
                        const signer = await provider.getSigner();
                        const contractInstance = getREXTokenContract(signer);
                        const userAccount = accounts[0].address;

                        setProvider(provider);
                        setAccount(userAccount);
                        setContract(contractInstance);
                        setIsConnected(true);

                        await fetchBalance(userAccount, contractInstance);
                    } else if (accounts.length > 0 && Number(network.chainId) !== EXPECTED_CHAIN_ID) {
                        // User is connected but on wrong network
                        setIsConnected(false);
                        setError(`Please switch to ${POLYGON_NETWORK_CONFIG.chainName}`);
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
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
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
            miningBonus,
            miningSlots,
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
