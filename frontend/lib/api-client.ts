const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://stellar-hackathon-project.onrender.com/api"

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  userData: {
    Id: string
    NgoName: string
    Email: string
    RegNumber: string
    Description: string
    createdAt: string
  }
}

interface SignupResponse {
  accessToken: string
  refreshToken: string
  userData: {
    Id: string
    NgoName: string
    Email: string
    RegNumber: string
    Description: string
    createdAt: string
  }
  blockchainAccount: {
    publicKey: string
  }
}

// Generic fetch wrapper with credentials for cookie-based auth
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // Include cookies in all requests
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || "API request failed",
        error: data.error,
      }
    }

    // Server returns { statusCode, data, message, success }
    // Map it to our expected format
    return {
      success: data.success || response.ok,
      data: data.data,
      message: data.message,
      error: data.error,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      success: false,
      error: message,
      message: message,
    }
  }
}

// Auth APIs - Updated to match backend documentation
export const authApi = {
  signup: async (ngoData: {
    ngoName: string
    regNumber: string
    description: string
    email: string
    phoneNo: string
    password: string
  }): Promise<SignupResponse> => {
    const response = await fetchWithAuth<SignupResponse>("/user/signup", {
      method: "POST",
      body: JSON.stringify(ngoData),
    })

    if (!response.success) {
      throw new Error(response.message || "Signup failed")
    }

    return response.data as SignupResponse
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetchWithAuth<LoginResponse>("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (!response.success) {
      throw new Error(response.message || "Login failed")
    }

    return response.data as LoginResponse
  },

  refresh: async (refreshToken: string) => {
    return fetchWithAuth("/user/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  },

  logout: () => {
    // Cookies are automatically cleared by backend
  },

  findUser: async (query: { email?: string; id?: string }) => {
    const params = new URLSearchParams()
    if (query.email) params.append("email", query.email)
    if (query.id) params.append("id", query.id)

    return fetchWithAuth(`/user-management/find?${params.toString()}`)
  },
}

// Posts APIs - Updated to match backend documentation
export const postsApi = {
  getAll: async () => {
    return await fetchWithAuth("/posts/");
  },

  getById: async (id: string) => {
    if (!id || typeof id !== 'string') {
      throw new Error('Task ID is required and must be a string')
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      throw new Error('API URL is not configured')
    }

    try {
      const response = await fetch(`${baseUrl}/api/posts/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch task:', error)
      throw error
    }
  },

  create: async (postData: {
    Title: string
    Type: string
    Description: string
    Location: string
    ImgCid: string
    NeedAmount: string
    WalletAddr: string
  }) => {
    return fetchWithAuth("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    })
  },
}

// Payment APIs - Updated to match backend documentation
export const paymentApi = {
  verifyDonation: async (data: {
    TransactionId: string
    postID: string
    Amount: number
  }) => {
    return fetchWithAuth("/payment/verify-donation", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  walletPay: async (data: {
    PublicKey: string
    PostId: string
    Amount: number
    Cid: string
  }) => {
    return fetchWithAuth("/payment/wallet-pay", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}

// Donations APIs
export const donationsApi = {
  getAll: async () => {
    return fetchWithAuth("/donations")
  },

  getById: async (transactionId: string) => {
    return fetchWithAuth(`/donations/${transactionId}`)
  },

  getByPost: async (postId: string) => {
    return fetchWithAuth(`/donations/post/${postId}`)
  },
}

// Expenses APIs
export const expensesApi = {
  getPreviousTransaction: async (postId: string) => {
    return fetchWithAuth(`/expenses/prev-txn/${postId}`)
  },

  create: async (data: { transactionData: unknown; postId: string }) => {
    return fetchWithAuth("/expenses/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}

// IPFS APIs - Updated to include credentials
export const ipfsApi = {
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${API_BASE_URL}/ipfs/upload`, {
        method: "POST",
        credentials: "include", // Include cookies for authenticated upload
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "IPFS upload failed")
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  },
}

// Stellar APIs - Updated to match backend documentation
export const stellarApi = {
  getBalance: async (publicKey: string) => {
    return fetchWithAuth(`/stellar/balance/${publicKey}`)
  },

  sendPayment: async (data: {
    senderKey: string
    receiverKey: string
    amount: number
    meta: { cid: string; prevTxn: string }
  }) => {
    return fetchWithAuth("/stellar/send-payment", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  verifyTransaction: async (transactionId: string) => {
    return fetchWithAuth(`/stellar/verify/${transactionId}`)
  },

  createAccount: async () => {
    return fetchWithAuth("/stellar/create-account", {
      method: "POST",
    })
  },

  deleteAccount: async (data: { secret: string; destination: string }) => {
    return fetchWithAuth("/stellar/delete-account", {
      method: "DELETE",
      body: JSON.stringify(data),
    })
  },

  smartContract: async (data: {
    privateKey: string
    reciverKey: string
    amount: number
    cid: string
    prevTxn: string
    metadata?: string
  }) => {
    return fetchWithAuth("/stellar/smart-contract", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
