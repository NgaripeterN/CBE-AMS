const { ethers } = require('ethers');
const stringify = require('json-stable-stringify');
const contractAbi = require('./contractAbi'); // Assuming ABI is externalized

let provider;

const getProvider = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  }
  return provider;
};

const getOnChainStatus = async (txHash) => {
  if (!txHash) {
    return 'N/A';
  }
  try {
    const provider = getProvider();
    const txReceipt = await provider.getTransactionReceipt(txHash);
    if (!txReceipt) {
      return 'Pending';
    }
    return txReceipt.status === 1 ? 'Confirmed' : 'Failed';
  } catch (error) {
    console.error(`Error fetching status for txHash ${txHash}:`, error);
    return 'Error';
  }
};

const verifyOnChain = async (payload) => {
    try {
        // Ensure payload is an object
        if (typeof payload !== 'object' || payload === null) {
            throw new Error("Invalid credential payload format.");
        }

        const canonicalizedPayload = stringify(payload);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalizedPayload));

        const provider = getProvider();
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, provider);

        const onChainData = await contract.getCredential(hash);
        
        const issuerAddress = onChainData[0];
        const timestamp = Number(onChainData[1]); // Convert BigInt to Number

        if (issuerAddress === ethers.ZeroAddress) {
            return { isValid: false, reason: "Credential hash not found on the blockchain." };
        }

        return {
            isValid: true,
            issuerAddress,
            timestamp: new Date(timestamp * 1000).toISOString(),
        };

    } catch (error) {
        console.error("On-chain verification failed:", error);
        return { isValid: false, reason: `An error occurred during verification: ${error.message}` };
    }
};

module.exports = { getOnChainStatus, verifyOnChain };
