const fs = require('fs');
const path = 'c:/Users/User/Desktop/VS.CODE/WEB3/Shagun/src/contracts/REXToken.json';
const abi = JSON.parse(fs.readFileSync(path, 'utf8'));

const newFunctions = [
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getTotalMiningRewards",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getMiningSlotsCompleted",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Check if already exists to avoid duplicates
if (!abi.find(f => f.name === 'getTotalMiningRewards')) {
    abi.push(...newFunctions);
    fs.writeFileSync(path, JSON.stringify(abi, null, 4));
    console.log("ABI updated successfully");
} else {
    console.log("Functions already exist in ABI");
}
