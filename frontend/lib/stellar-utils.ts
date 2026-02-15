// Stellar Utils with Real API Integration
import { apiService } from './api-service';

// Mock Stellar SDK classes and functions for frontend compatibility
const Networks = {
  TESTNET_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
}

const BASE_FEE = "100"

class Server {
  constructor(private url: string) {}

  async loadAccount(publicKey: string) {
    try {
      // Use real API to get balance
      const response = await apiService.getWalletBalance(publicKey);
      const balances = response.data || [];
      
      return {
        id: publicKey,
        account_id: publicKey,
        balances: balances.map((balance: any) => ({
          balance: balance.balance.toString(),
          asset_type: balance.asset === "XLM" ? "native" : "credit_alphanum4",
          asset_code: balance.asset !== "XLM" ? balance.asset : undefined,
          asset_issuer: balance.issuer || undefined,
        })),
        sequence: "1",
      }
    } catch (error) {
      console.error("Error loading account:", error);
      // Fallback to mock data
      return {
        id: publicKey,
        account_id: publicKey,
        balances: [
          {
            balance: "1000.0000000",
            asset_type: "native",
          },
        ],
        sequence: "1",
      }
    }
  }

  async submitTransaction(signedTx: any) {
    // Mock transaction submission - in real implementation, this would submit to Stellar network
    return {
      hash: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ledger: Math.floor(Math.random() * 1000000),
      successful: true,
    }
  }
}

class TransactionBuilder {
  private operations: any[] = []
  private memo: any = null
  private timeout = 30

  constructor(
    private account: any,
    private options: any,
  ) {}

  addMemo(memo: any) {
    this.memo = memo
    return this
  }

  addOperation(operation: any) {
    this.operations.push(operation)
    return this
  }

  setTimeout(timeout: number) {
    this.timeout = timeout
    return this
  }

  build() {
    return {
      toEnvelope: () => ({
        toXDR: () => `mock_xdr_${Date.now()}`,
      }),
    }
  }
}

const Operation = {
  payment: (options: any) => ({
    type: "payment",
    ...options,
  }),
}

const Asset = {
  native: () => ({
    code: "XLM",
    issuer: null,
  }),
}

const Memo = {
  text: (text: string) => ({
    type: "text",
    value: text,
  }),
}

const server = new Server("https://horizon-testnet.stellar.org")
const networkPassphrase = Networks.TESTNET_NETWORK_PASSPHRASE

export async function submitDonationTransaction(
  publicKey: string,
  amount: string,
  taskId: string,
  receiverPublicKey: string, // NGO's wallet address from post data
  signTransaction: (tx: string) => Promise<string>,
) {
  try {
    console.log("Starting donation transaction:", { publicKey, amount, taskId, receiverPublicKey })
    
    // Validate and format amount - Stellar requires string with max 7 decimals
    const amountNumber = parseFloat(amount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      throw new Error("Invalid amount. Please enter a positive number.")
    }
    
    // Format to max 7 decimal places as required by Stellar
    const formattedAmount = amountNumber.toFixed(7)
    console.log("Formatted amount:", formattedAmount)
    
    // Validate receiver address
    if (!receiverPublicKey || receiverPublicKey.length !== 56 || !receiverPublicKey.startsWith('G')) {
      throw new Error("Invalid receiver wallet address from post data")
    }
    
    // Import Stellar SDK dynamically
    const StellarSdk = await import('@stellar/stellar-sdk')
    
    // Step 1: Load sender account from Stellar network
    console.log("Loading account from Stellar...")
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
    const account = await server.loadAccount(publicKey)
    
    // Step 2: Create payment transaction
    console.log("Creating payment transaction...")
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: StellarSdk.Asset.native(),
          amount: formattedAmount, // Use formatted amount string
        })
      )
      .addMemo(StellarSdk.Memo.text(`Donation`)) // Keep memo short (max 28 bytes)
      .setTimeout(180) // 3 minutes timeout
      .build()
    
    // Step 3: Convert to XDR for signing
    const transactionXDR = transaction.toXDR()
    console.log("Transaction XDR created, requesting signature...")
    
    // Step 4: Sign transaction with Freighter wallet
    const signedXDR = await signTransaction(transactionXDR)
    console.log("Transaction signed by user")
    
    // Step 5: Parse signed transaction to get hash
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      StellarSdk.Networks.TESTNET
    )
    const transactionHash = signedTransaction.hash().toString('hex')
    console.log("Transaction hash:", transactionHash)
    
    // Step 6: Submit transaction to Stellar network
    console.log("Submitting transaction to Stellar network...")
    const result = await server.submitTransaction(signedTransaction)
    console.log("Transaction submitted successfully:", result)
    
    // Step 7: Send transaction data to backend for verification and storage
    const donationData = {
      TransactionId: transactionHash,
      postID: taskId,
      Amount: parseFloat(amount),
    }
    
    console.log("Verifying donation with backend:", donationData)
    const response = await apiService.verifyDonation(donationData)

    if (response.success) {
      console.log("Donation verified and saved:", response.data)
      
      return {
        success: true,
        hash: transactionHash,
        ledger: result.ledger,
        stellarResult: result,
        data: response.data
      }
    } else {
      throw new Error(response.message || "Donation verification failed")
    }
  } catch (error) {
    console.error("Donation transaction error:", error)
    
    // Provide more detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('op_underfunded')) {
        throw new Error("Insufficient XLM balance to complete transaction")
      } else if (error.message.includes('User declined')) {
        throw new Error("Transaction cancelled by user")
      } else if (error.message.includes('account not found')) {
        throw new Error("Account not found on Stellar network. Please fund your account first.")
      }
    }
    
    throw error
  }
}

export async function getAccountBalance(publicKey: string) {
  try {
    console.log("Fetching balance for:", publicKey);
    const response = await apiService.getWalletBalance(publicKey);
    console.log("Balance API response:", response);
    
    const balances = response.data || [];
    const xlmBalance = balances.find((b: any) => b.asset === "XLM");
    const balance = xlmBalance ? Number.parseFloat(xlmBalance.balance) : 0;
    
    console.log("Parsed balance:", balance);
    return balance;
  } catch (error) {
    console.warn("Balance fetch error (using fallback):", error)
    // Fallback to mock data - return 0 to show wallet is connected but balance unavailable
    return 0;
  }
}

// New function to create Stellar account via API
export async function createStellarAccount() {
  try {
    const response = await apiService.createStellarAccount();
    return response.data;
  } catch (error) {
    console.error("Error creating Stellar account:", error);
    throw error;
  }
}

// NGO function to send payment to another wallet (e.g., vendor, beneficiary)
// This is used by NGOs to disburse funds from their wallet
export async function ngoWalletPayment(
  receiverPublicKey: string,
  postId: string,
  amount: number,
  cid: string
) {
  try {
    console.log("NGO wallet payment:", { receiverPublicKey, postId, amount, cid })
    
    const payData = {
      PublicKey: receiverPublicKey,
      PostId: postId,
      Amount: amount,
      Cid: cid,
    }
    
    const response = await apiService.walletPay(payData);
    
    if (response.success) {
      console.log("NGO payment successful:", response.data)
      return response.data;
    } else {
      throw new Error(response.message || "NGO payment failed")
    }
  } catch (error) {
    console.error("Error in NGO wallet payment:", error);
    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function sendPaymentViaAPI(
  senderKey: string,
  receiverKey: string,
  amount: number,
  meta: { cid: string; prevTxn?: string }
) {
  try {
    const response = await apiService.sendPayment({
      senderKey,
      receiverKey,
      amount,
      meta,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending payment:", error);
    throw error;
  }
}
