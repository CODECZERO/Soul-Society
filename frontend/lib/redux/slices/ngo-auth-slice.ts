import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export interface NGOProfile {
  id: string
  name: string
  email: string
  registrationNumber: string
  description: string
  logo?: string
  publicKey?: string
  createdAt: string  // ISO string, not Date object (for Redux serialization)
}

interface NGOAuthState {
  isAuthenticated: boolean
  ngoProfile: NGOProfile | null
  isLoading: boolean
  error: string | null
  fieldErrors: Record<string, string> | null
}

const initialState: NGOAuthState = {
  isAuthenticated: false,
  ngoProfile: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
}

// Helper function to set cookies safely
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== 'undefined') {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }
};

export const loginNGO = createAsyncThunk(
  "ngoAuth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { login } = await import("@/lib/api-service")
      const response = await login({ email, password })

      if (response.success && response.data) {
        const { accessToken, refreshToken, userData } = response.data

        // Convert backend user data to frontend format
        const ngoProfile: NGOProfile = {
          id: userData.Id,
          name: userData.NgoName,
          email: userData.Email,
          registrationNumber: userData.RegNumber,
          description: userData.Description,
          publicKey: userData.PublicKey,
          createdAt: userData.createdAt || new Date().toISOString(),
        }

        // Store tokens and profile in client-side storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          localStorage.setItem('ngo_profile', JSON.stringify(ngoProfile))

          // Set cookies for authentication
          setCookie('accessToken', accessToken)
          setCookie('refreshToken', refreshToken)
          setCookie('ngo_profile', JSON.stringify(ngoProfile))
        }

        return ngoProfile
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      return rejectWithValue(message)
    }
  },
)

export const signupNGO = createAsyncThunk(
  "ngoAuth/signup",
  async (ngoData: any, { rejectWithValue }) => {
    try {
      const { signup } = await import("@/lib/api-service")
      const response = await signup({
        ngoName: ngoData.name || ngoData.ngoName,
        regNumber: ngoData.registrationNumber || ngoData.regNumber,
        description: ngoData.description,
        email: ngoData.email,
        phoneNo: ngoData.phoneNo,
        password: ngoData.password,
      })

      if (response.success && response.data) {
        const { accessToken, refreshToken, userData } = response.data

        // Store in localStorage for frontend access
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
        }

        // Set cookies for authentication (backend uses these)
        document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
        document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`

        // Convert backend user data to frontend format
        const ngoProfile: NGOProfile = {
          id: userData.Id,
          name: userData.NgoName,
          email: userData.Email,
          registrationNumber: userData.RegNumber,
          description: userData.Description,
          publicKey: userData.PublicKey,
          createdAt: userData.createdAt || new Date().toISOString(),  // Store as ISO string
        }

        // Store NGO profile in localStorage and cookie
        if (typeof window !== 'undefined') {
          localStorage.setItem('ngo_profile', JSON.stringify(ngoProfile))
        }
        document.cookie = `ngo_profile=${encodeURIComponent(JSON.stringify(ngoProfile))}; path=/; max-age=${7 * 24 * 60 * 60}`

        return ngoProfile
      } else {
        throw new Error(response.message || "Signup failed")
      }
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || "Signup failed",
        errors: error.errors
      })
    }
  },
)

export const checkNGOCookieThunk = createAsyncThunk(
  "ngoAuth/checkCookie",
  async (_, { rejectWithValue }) => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      // Try localStorage first
      const profileStr = localStorage.getItem('ngo_profile')
      if (profileStr) {
        try {
          return JSON.parse(profileStr) as NGOProfile
        } catch (parseError) {
          localStorage.removeItem('ngo_profile')
        }
      }

      // Fallback to cookies
      const cookies = document.cookie.split("; ").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      if (cookies.ngo_profile) {
        try {
          const profile = JSON.parse(decodeURIComponent(cookies.ngo_profile))
          // Sync localStorage if it was missing but cookie exists
          localStorage.setItem('ngo_profile', JSON.stringify(profile))
          return profile as NGOProfile
        } catch (err) {
          return null
        }
      }
    } catch (error) {
      return null
    }

    return null
  },
)

const ngoAuthSlice = createSlice({
  name: "ngoAuth",
  initialState,
  reducers: {
    logoutNGO: (state) => {
      // Clear all auth-related data from localStorage and cookies
      if (typeof window !== 'undefined') {
        // Clear authentication data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('ngo_profile')

        // Clear wallet data from localStorage
        localStorage.removeItem('wallet_connected')
        localStorage.removeItem('wallet_type')
        localStorage.removeItem('wallet_publicKey')
        localStorage.removeItem('wallet_balance')

        // Clear session storage
        sessionStorage.clear()
      }

      // Clear all auth cookies
      const cookieOptions = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = `accessToken=; ${cookieOptions}`
      document.cookie = `refreshToken=; ${cookieOptions}`
      document.cookie = `ngo_profile=; ${cookieOptions}`

      // Clear wallet-related cookies
      document.cookie = `wallet_connected=; ${cookieOptions}`
      document.cookie = `wallet_address=; ${cookieOptions}`
      document.cookie = `wallet_type=; ${cookieOptions}`

      // Clear all cookies (brute force approach for development)
      const cookies = document.cookie.split(';')
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=; ${cookieOptions}`
      }

      // Reset state
      state.isAuthenticated = false
      state.ngoProfile = null
      state.error = null

      // Force a full page reload to ensure all state is cleared
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    },
    clearNGOError: (state) => {
      state.error = null
      state.fieldErrors = null
    },
    checkNGOCookie: (state) => {
      // Check if NGO is already logged in via cookies
      if (typeof window !== "undefined") {
        const cookies = document.cookie.split("; ").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.split("=")
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

        if (cookies.accessToken && cookies.ngo_profile) {
          try {
            const profile = JSON.parse(decodeURIComponent(cookies.ngo_profile))
            state.ngoProfile = profile
            state.isAuthenticated = true
          } catch (err) {
            // Clear corrupted cookie
            document.cookie = "ngo_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginNGO.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginNGO.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.ngoProfile = action.payload
      })
      .addCase(loginNGO.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(signupNGO.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signupNGO.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.ngoProfile = action.payload
      })
      .addCase(signupNGO.rejected, (state, action: any) => {
        state.isLoading = false
        if (action.payload && typeof action.payload === 'object') {
          state.error = action.payload.message
          if (action.payload.errors) {
            const fieldErrors: Record<string, string> = {}
            action.payload.errors.forEach((err: any) => {
              // Map 'body.ngoName' to 'ngoName'
              const field = err.path.split('.').pop()
              fieldErrors[field] = err.message
            })
            state.fieldErrors = fieldErrors
          }
        } else {
          state.error = action.payload as string || "Signup failed"
        }
      })
      .addCase(checkNGOCookieThunk.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkNGOCookieThunk.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.isAuthenticated = true
          state.ngoProfile = action.payload as NGOProfile
        }
      })
      .addCase(checkNGOCookieThunk.rejected, (state) => {
        state.isLoading = false
      })
  },
})

export const { logoutNGO, clearNGOError, checkNGOCookie } = ngoAuthSlice.actions
export default ngoAuthSlice.reducer
