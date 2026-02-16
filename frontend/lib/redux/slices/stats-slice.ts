import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { apiClient } from "@/lib/api-client"

interface StatsState {
    leaderboard: any[]
    contributors: any[]
    platformStats: {
        totalRaised: number
        activeDonors: number
        verifiedNGOs: number
    } | null
    ngoStats: Record<string, {
        totalRaised: number
        totalSpent: number
        remainingBalance: number
        chartData: any[]
    }>
    isLoading: boolean
    error: string | null
    lastFetched: {
        leaderboard: number | null
        contributors: number | null
        platformStats: number | null
        ngoStats: Record<string, number>
    }
}

const initialState: StatsState = {
    leaderboard: [],
    contributors: [],
    platformStats: null,
    ngoStats: {},
    isLoading: false,
    error: null,
    lastFetched: {
        leaderboard: null,
        contributors: null,
        platformStats: null,
        ngoStats: {},
    },
}

const CACHE_TTL = 5 * 60 * 1000

export const fetchLeaderboard = createAsyncThunk(
    "stats/fetchLeaderboard",
    async (force: boolean = false, { getState, rejectWithValue }) => {
        const state = (getState() as any).stats as StatsState
        const now = Date.now()
        if (!force && state.lastFetched.leaderboard && now - state.lastFetched.leaderboard < CACHE_TTL && state.leaderboard.length > 0) {
            return state.leaderboard
        }
        try {
            const response = await apiClient.request<any>('/stats/leaderboard')
            return response.data
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch leaderboard")
        }
    }
)

export const fetchContributors = createAsyncThunk(
    "stats/fetchContributors",
    async (ngoId: string | null, { getState, rejectWithValue }) => {
        const state = (getState() as any).stats as StatsState
        const now = Date.now()

        if (state.lastFetched.contributors && now - state.lastFetched.contributors < CACHE_TTL && state.contributors.length > 0) {
            return state.contributors
        }

        try {
            let url = '/stats/leaderboard/contributors'
            if (ngoId) url += `?ngoId=${ngoId}`
            const response = await apiClient.request<any>(url)
            return response.data
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch contributors")
        }
    }
)

export const fetchPlatformStats = createAsyncThunk(
    "stats/fetchPlatformStats",
    async (force: boolean = false, { getState, rejectWithValue }) => {
        const state = (getState() as any).stats as StatsState
        const now = Date.now()
        if (!force && state.lastFetched.platformStats && now - state.lastFetched.platformStats < CACHE_TTL && state.platformStats) {
            return state.platformStats
        }
        try {
            const response = await apiClient.request<any>('/stats')
            return response.data
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch stats")
        }
    }
)

export const fetchNgoStats = createAsyncThunk(
    "stats/fetchNgoStats",
    async ({ ngoId, force = false }: { ngoId: string, force?: boolean }, { getState, rejectWithValue }) => {
        const state = (getState() as any).stats as StatsState
        const now = Date.now()
        if (!force && state.lastFetched.ngoStats[ngoId] && now - state.lastFetched.ngoStats[ngoId] < CACHE_TTL && state.ngoStats[ngoId]) {
            return { ngoId, data: state.ngoStats[ngoId] }
        }
        try {
            const response = await apiClient.request<any>(`/stats/ngo/${ngoId}`)
            return { ngoId, data: response.data }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch NGO stats")
        }
    }
)

const statsSlice = createSlice({
    name: "stats",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeaderboard.pending, (state) => { state.isLoading = true })
            .addCase(fetchLeaderboard.fulfilled, (state, action) => {
                state.isLoading = false
                state.leaderboard = action.payload || []
                state.lastFetched.leaderboard = Date.now()
            })
            .addCase(fetchContributors.fulfilled, (state, action) => {
                state.isLoading = false
                state.contributors = action.payload || []
                state.lastFetched.contributors = Date.now()
            })
            .addCase(fetchPlatformStats.fulfilled, (state, action) => {
                state.isLoading = false
                state.platformStats = action.payload
                state.lastFetched.platformStats = Date.now()
            })
            .addCase(fetchNgoStats.pending, (state) => {
                state.isLoading = true
            })
            .addCase(fetchNgoStats.fulfilled, (state, action) => {
                state.isLoading = false
                state.ngoStats[action.payload.ngoId] = action.payload.data
                state.lastFetched.ngoStats[action.payload.ngoId] = Date.now()
            })
            .addCase(fetchNgoStats.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
    },
})

export default statsSlice.reducer
