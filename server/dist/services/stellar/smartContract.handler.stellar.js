import * as StellarSdk from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import dotenv from "dotenv";
dotenv.config();
// Initialize server with Soroban testnet
const server = new Server(process.env.SOROBAN_RPC_URL);
export async function saveContractWithWallet(userData) {
    try {
        const contractId = process.env.CONTRACT_ID;
        if (!contractId) {
            throw new Error('CONTRACT_ID is not defined in environment variables');
        }
        const contract = new StellarSdk.Contract(contractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(userData.privateKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const fee = StellarSdk.BASE_FEE;
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: StellarSdk.Networks.TESTNET
        })
            .setTimeout(30)
            .addOperation(contract.call("store_data", StellarSdk.nativeToScVal(accountId, { type: "address" }), StellarSdk.nativeToScVal(userData.amount, { type: "i128" }), StellarSdk.nativeToScVal(userData.cid, { type: "string" }), StellarSdk.nativeToScVal(userData.prevTxn || "no txn", { type: "string" }), userData.metadata
            ? StellarSdk.nativeToScVal(userData.metadata, { type: "string" })
            : StellarSdk.xdr.ScVal.scvVoid()))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        preparedTx.sign(sourceKeypair);
        const result = await server.sendTransaction(preparedTx);
        console.log("Store Data Transaction:");
        console.log("hash:", result.hash);
        console.log("status:", result.status);
        console.log("errorResult:", result.errorResult);
        // Wait for transaction confirmation
        if (result.status === "PENDING") {
            let txResponse = await server.getTransaction(result.hash);
            while (txResponse.status === "NOT_FOUND") {
                await new Promise(resolve => setTimeout(resolve, 1000));
                txResponse = await server.getTransaction(result.hash);
            }
            console.log("Final status:", txResponse.status);
            return txResponse;
        }
        return result;
    }
    catch (error) {
        console.error("Error storing data:", error);
        throw error;
    }
}
export async function getLatestData(privateKey) {
    try {
        const contractId = process.env.CONTRACT_ID;
        if (!contractId) {
            throw new Error('CONTRACT_ID is not defined in environment variables');
        }
        const contract = new StellarSdk.Contract(contractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(privateKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const fee = StellarSdk.BASE_FEE;
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: StellarSdk.Networks.TESTNET
        })
            .setTimeout(30)
            .addOperation(contract.call("get_latest", StellarSdk.nativeToScVal(accountId, { type: "address" })))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        const result = await server.simulateTransaction(preparedTx);
        // Check if simulation was successful
        const simulationResult = result?.results?.[0];
        if (simulationResult?.xdr) {
            const returnValue = StellarSdk.xdr.ScVal.fromXDR(simulationResult.xdr, 'base64');
            console.log("Latest Data:");
            console.log("Raw return value:", returnValue);
            // Parse the XDR response if needed
            if (returnValue.switch() === StellarSdk.xdr.ScValType.scvMap()) {
                const data = {};
                const map = returnValue.map();
                if (map) {
                    for (const entry of map) {
                        const key = entry.key().str()?.toString() || entry.key().sym()?.toString() || 'unknown';
                        const val = entry.val();
                        if (val.switch) {
                            switch (val.switch().name) {
                                case 'scvBool':
                                    data[key] = val.value();
                                    break;
                                case 'scvU32':
                                case 'scvI32':
                                case 'scvU64':
                                case 'scvI64':
                                case 'scvU128':
                                case 'scvI128':
                                    const value = val.value();
                                    data[key] = value !== null && value !== undefined ? value.toString() : '';
                                    break;
                                case 'scvString':
                                    data[key] = val.str()?.toString() || '';
                                    break;
                                case 'scvSymbol':
                                    data[key] = val.sym()?.toString() || '';
                                    break;
                                default:
                                    data[key] = 'Unsupported type: ' + val.switch().name;
                            }
                        }
                    }
                    return data;
                }
            }
            return { value: returnValue };
        }
        console.log("No data found or error in simulation:", result);
        return null;
    }
    catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}
// Example usage
async function main() {
    try {
        console.log("=== Storing Data ===");
        // Example usage - replace with actual values
        await saveContractWithWallet({
            privateKey: "YOUR_PRIVATE_KEY",
            amount: 1000,
            cid: "example_cid_123",
            prevTxn: "example_prev_txn"
        });
        console.log("\n=== Getting Latest Data ===");
        const latestData = await getLatestData("YOUR_PRIVATE_KEY");
        console.log("Latest data:", latestData);
    }
    catch (error) {
        console.error("Error in main function:", error);
    }
}
// Uncomment to run the example
// main().catch(console.error);
//# sourceMappingURL=smartContract.handler.stellar.js.map