// API Service Layer for Soul-Society Frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Types based on backend structure
// Bleach Motif Aliases
export type Mission = Post;
export type DivisionCaptain = NGO;
export type ReiatsuInfusion = Donation;

export interface Post {
  _id: string;
  Title: string;
  Type: string;
  Description: string;
  Location: string;
  ImgCid: string;
  NeedAmount: string;
  WalletAddr: string;
  NgoRef: string;
  CollectedAmount?: number; // Amount collected in INR
  Status?: "Active" | "Completed" | "Failed";
  DangerLevel?: "Low" | "Medium" | "High" | "Extreme";
  // Backward compatibility
  id?: string;
  title?: string;
  category?: string;
  goal?: number;
  raised?: number;
  image?: string;
  ngo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NGO {
  _id: string;
  Email: string;
  NgoName: string;
  RegNumber: string;
  Description: string;
  PublicKey?: string;
  PrivateKey?: string;
  PhoneNo: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Donation {
  _id: string;
  currentTxn: string;
  postIDs: string;
  Amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  _id: string;
  currentTxn: any;
  postIDs: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  ngoName: string;
  regNumber: string;
  description: string;
  email: string;
  phoneNo: string;
  password: string;
  publicKey?: string;
  privateKey?: string;
}

export interface DonationData {
  TransactionId: string;
  postID: string;
  Amount: number;
}

export interface PayWallet {
  PublicKey: string;
  PostId: string;
  Amount: number;
  Cid: string;
}

// API Service Class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = false // New parameter to indicate if auth is required
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {};

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include cookies in requests
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          throw new Error('Malformed JSON response from server');
        }
      } else {
        // Not JSON - probably an HTML error page (404/500)
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 100));
        throw new Error(`Server returned ${response.status}: Non-JSON response received`);
      }

      // Handle token expiration - only for endpoints that require auth
      if (!response.ok && data?.message === "Invalid or expired token" && requiresAuth) {
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          // Retry the request with new token
          const newToken = this.getAuthToken();
          if (newToken) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`
            };
            const retryResponse = await fetch(url, config);
            const retryData = await retryResponse.json();

            if (!retryResponse.ok) {
              throw new Error(retryData.message || 'Request failed');
            }
            return retryData;
          }
        }
        // If refresh failed, clear auth
        this.clearAuth();
        throw new Error("Session expired. Please login again.");
      }

      // Handle other authentication errors - only for endpoints that require auth
      if (!response.ok && (data.message === "Access token is required" || data.message === "Invalid token")) {
        if (requiresAuth) {
          console.log('Authentication error:', data.message);
          this.clearAuth();
          throw new Error("Please login to continue.");
        }
        // For non-auth endpoints, just log and continue with the error
        console.warn('Auth error on public endpoint:', data.message);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Try localStorage first (preferred)
    let token = localStorage.getItem('accessToken');

    // Fallback to cookies if localStorage is empty
    if (!token) {
      const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      token = cookies.accessToken || null;
    }

    console.log('Retrieved token:', token ? `${token.substring(0, 20)}...` : 'No token found');
    return token;
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Try localStorage first
    let token = localStorage.getItem('refreshToken');

    // Fallback to cookies
    if (!token) {
      const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      token = cookies.refreshToken || null;
    }

    return token;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      const response = await fetch(`${this.baseURL}/user/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const { accessToken, refreshToken: newRefreshToken } = data.data;

          // Store in both localStorage and cookies
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
          document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;

          console.log('Token refreshed successfully');
          return true;
        }
      }

      console.log('Token refresh failed');
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private clearAuth(): void {
    // Clear all auth storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('ngo_profile');
    }

    // Clear cookies
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "refreshToken=; path=/; max-age=0";
    document.cookie = "ngo_profile=; path=/; max-age=0";

    // Dispatch logout action if Redux is available
    if (typeof window !== 'undefined' && (window as any).dispatch) {
      (window as any).dispatch({ type: 'ngoAuth/logoutNGO' });
    }

    // Redirect to login or show auth modal
    if (typeof window !== 'undefined') {
      // Dispatch open auth modal action
      if ((window as any).dispatch) {
        (window as any).dispatch({ type: 'ui/openAuthModal' });
      }
    }

    console.log('Auth cleared');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      // Decode token to check expiration (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  }

  // Test authentication
  async testAuth(): Promise<ApiResponse<any>> {
    return this.request('/posts');
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ timestamp: string }>> {
    return this.request('/health');
  }

  // User/NGO Authentication
  async login(loginData: LoginData): Promise<ApiResponse<any>> {
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async signup(signupData: SignupData): Promise<ApiResponse<any>> {
    return this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  // Posts
  async getPosts(): Promise<ApiResponse<Post[]>> {
    return this.request('/posts', {}, false); // Public endpoint
  }

  async createPost(postData: Omit<Post, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Post>> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }, true); // Requires NGO auth
  }

  // Donations
  async getDonations(): Promise<ApiResponse<Donation[]>> {
    return this.request('/donations', {}, false); // Public endpoint
  }

  async getDonationById(transactionId: string): Promise<ApiResponse<Donation>> {
    return this.request(`/donations/${transactionId}`, {}, false); // Public endpoint
  }

  async getDonationsByPost(postId: string): Promise<ApiResponse<Donation[]>> {
    return this.request(`/donations/post/${postId}`, {}, false); // Public endpoint
  }

  async verifyDonation(donationData: DonationData): Promise<ApiResponse<any>> {
    return this.request('/payment/verify-donation', {
      method: 'POST',
      body: JSON.stringify(donationData),
    }, false); // Public endpoint - users can donate without NGO auth
  }

  // Payments
  async walletPay(payData: PayWallet): Promise<ApiResponse<any>> {
    return this.request('/payment/wallet-pay', {
      method: 'POST',
      body: JSON.stringify(payData),
    }, true); // Requires NGO auth - only NGOs can send payments
  }

  // Stellar Operations
  async getWalletBalance(publicKey: string): Promise<ApiResponse<any[]>> {
    return this.request(`/stellar/balance/${publicKey}`, {}, false); // Public endpoint
  }

  async sendPayment(paymentData: {
    senderKey: string;
    receiverKey: string;
    amount: number;
    meta: {
      cid: string;
      prevTxn?: string;
    };
  }): Promise<ApiResponse<any>> {
    return this.request('/stellar/send-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyTransaction(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/stellar/verify/${transactionId}`);
  }

  async createStellarAccount(): Promise<ApiResponse<any>> {
    return this.request('/stellar/create-account', {
      method: 'POST',
    });
  }

  async saveToSmartContract(contractData: {
    privateKey: string;
    reciverKey: string;
    amount: number;
    cid: string;
    prevTxn: string;
    metadata?: string;
    contractId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/stellar/smart-contract', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async getLatestContractData(privateKey: string, contractId?: string): Promise<ApiResponse<any>> {
    return this.request('/stellar/get-latest-data', {
      method: 'POST',
      body: JSON.stringify({ privateKey, contractId }),
    });
  }

  async deleteStellarAccount(secret: string, destination: string): Promise<ApiResponse<any>> {
    return this.request('/stellar/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ secret, destination }),
    });
  }

  // Get donations for a specific post
  async getDonationsByPostId(postId: string): Promise<ApiResponse<Donation[]>> {
    return this.request(`/donations/post/${postId}`);
  }

  // Get expenses for a specific post  
  async getExpensesByPostId(postId: string): Promise<ApiResponse<any>> {
    return this.request(`/expenses/prev-txn/${postId}`);
  }

  // Create expense record
  async createExpenseRecord(txnData: any, postId: string): Promise<ApiResponse<any>> {
    return this.request('/expenses/create', {
      method: 'POST',
      body: JSON.stringify({ txnData, postId }),
    });
  }

  // IPFS
  async uploadToIPFS(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/ipfs/upload', {
      method: 'POST',
      body: formData,
      // Don't set any headers - let browser set Content-Type with boundary
    });
  }

  // Expenses
  async getPreviousTransaction(postId: string): Promise<ApiResponse<{ prevTxn: string }>> {
    return this.request(`/expenses/prev-txn/${postId}`);
  }

  async createTransactionRecord(txnData: any, postId: string): Promise<ApiResponse<Expense>> {
    return this.request('/expenses/create', {
      method: 'POST',
      body: JSON.stringify({ txnData, postId }),
    });
  }

  // User Management
  async findUser(email?: string, id?: string): Promise<ApiResponse<NGO[]>> {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (id) params.append('id', id);

    return this.request(`/user-management/find?${params.toString()}`);
  }

  async getUserPrivateKey(userId: string): Promise<ApiResponse<{ privateKey: string }>> {
    return this.request(`/user-management/private-key/${userId}`);
  }

  // Stats
  async getStats(): Promise<ApiResponse<{ totalRaised: number; activeDonors: number; verifiedNGOs: number }>> {
    return this.request('/stats');
  }

  async getLeaderboard(): Promise<ApiResponse<any[]>> {
    return this.request('/stats/leaderboard');
  }

  async getDonorStats(walletAddr: string): Promise<ApiResponse<any>> {
    return this.request(`/stats/donor/${walletAddr}`);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const {
  healthCheck,
  login,
  signup,
  getPosts,
  createPost,
  getDonations,
  getDonationById,
  getDonationsByPost,
  verifyDonation,
  walletPay,
  getWalletBalance,
  sendPayment,
  verifyTransaction,
  createStellarAccount,
  saveToSmartContract,
  getLatestContractData,
  uploadToIPFS,
  getPreviousTransaction,
  createTransactionRecord,
  findUser,
  getUserPrivateKey,
  getStats,
  getLeaderboard,
  getDonorStats,
} = apiService;
