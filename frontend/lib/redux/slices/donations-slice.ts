import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { donationsApi } from "@/lib/api-client"

interface Donation {
  _id: string
  TransactionId: string
  postID: string
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
}

const initialState: DonationsState = {
  donations: [],
  isLoading: false,
  error: null,
  currentDonation: null,
  postDonations: [],
}

// Async thunks
export const fetchAllDonations = createAsyncThunk(
  "donations/fetchAllDonations",
  async (_, { rejectWithValue }) => {
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

export const { clearDonationsError, clearCurrentDonation, clearPostDonations } = donationsSlice.actions
export default donationsSlice.reducer
