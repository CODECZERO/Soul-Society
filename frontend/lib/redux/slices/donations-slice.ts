import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { donationsApi } from "@/lib/api-client"

interface Donation {
  _id: string
  TransactionId: string
  postIDs: string
  Amount: number
  DonorAddress: string
  createdAt: string
  updatedAt: string
}

interface DonationsState {
  donations: Donation[]
  isLoading: boolean
  error: string | null
  currentDonation: Donation | null
  postDonations: Donation[]
  lastFetched: number | null
  refreshCounter: number
}

const initialState: DonationsState = {
  donations: [],
  isLoading: false,
  error: null,
  currentDonation: null,
  postDonations: [],
  lastFetched: null,
  refreshCounter: 0,
}

// TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Async thunks
export const fetchAllDonations = createAsyncThunk(
  "donations/fetchAllDonations",
  async (force: boolean = false, { getState, rejectWithValue, dispatch }) => {
    const state = (getState() as any).donations as DonationsState
    const now = Date.now()

    // 1. Check if we should use cache
    if (!force && state.lastFetched && now - state.lastFetched < CACHE_TTL && state.donations.length > 0) {
      return state.donations // Return cached data
    }

    // 2. Refresh counter logic
    if (!force) {
      dispatch(incrementDonationRefreshCounter())
      if (state.refreshCounter < 3) {
        if (state.donations.length > 0) return state.donations
      }
    }

    try {
      const response = await donationsApi.getAll()
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch donations")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch donations"
      return rejectWithValue(message)
    }
  }
)

export const fetchDonationById = createAsyncThunk(
  "donations/fetchDonationById",
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await donationsApi.getById(transactionId)
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch donation")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch donation"
      return rejectWithValue(message)
    }
  }
)

export const fetchDonationsByPost = createAsyncThunk(
  "donations/fetchDonationsByPost",
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await donationsApi.getByPost(postId)
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch post donations")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch post donations"
      return rejectWithValue(message)
    }
  }
)

const donationsSlice = createSlice({
  name: "donations",
  initialState,
  reducers: {
    clearDonationsError: (state) => {
      state.error = null
    },
    clearCurrentDonation: (state) => {
      state.currentDonation = null
    },
    clearPostDonations: (state) => {
      state.postDonations = []
    },
    incrementDonationRefreshCounter: (state) => {
      state.refreshCounter += 1
    },
    resetDonationRefreshCounter: (state) => {
      state.refreshCounter = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Donations
      .addCase(fetchAllDonations.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAllDonations.fulfilled, (state, action) => {
        state.isLoading = false
        state.donations = action.payload || []
        state.lastFetched = Date.now()
        state.refreshCounter = 0 // Reset on success
      })
      .addCase(fetchAllDonations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch Donation by ID
      .addCase(fetchDonationById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDonationById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentDonation = action.payload
      })
      .addCase(fetchDonationById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch Donations by Post
      .addCase(fetchDonationsByPost.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDonationsByPost.fulfilled, (state, action) => {
        state.isLoading = false
        state.postDonations = action.payload || []
      })
      .addCase(fetchDonationsByPost.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearDonationsError, clearCurrentDonation, clearPostDonations, incrementDonationRefreshCounter, resetDonationRefreshCounter } = donationsSlice.actions
export default donationsSlice.reducer
