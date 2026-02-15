import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { postsApi } from "@/lib/api-client"

interface Post {
  _id: string
  Title: string
  Type: string
  Description: string
  NeedAmount: string
  WalletAddr: string
  NgoRef: string
  ImgCid?: string
  Location?: string
  createdAt?: string
  updatedAt?: string
}

interface PostsState {
  posts: Post[]
  isLoading: boolean
  error: string | null
  currentPost: Post | null
}

const initialState: PostsState = {
  posts: [],
  isLoading: false,
  error: null,
  currentPost: null,
}

// Async thunks
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await postsApi.getAll()
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch posts")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch posts"
      return rejectWithValue(message)
    }
  }
)

export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.getById(postId)
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch post")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch post"
      return rejectWithValue(message)
    }
  }
)

export const createPost = createAsyncThunk(
  "posts/createPost",
  async (postData: {
    Title: string
    Type: string
    Description: string
    Location: string
    ImgCid: string
    NeedAmount: string
    WalletAddr: string
  }, { rejectWithValue }) => {
    try {
      const response = await postsApi.create(postData)
      if (!response.success) {
        throw new Error(response.message || "Failed to create post")
      }
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post"
      return rejectWithValue(message)
    }
  }
)

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPostsError: (state) => {
      state.error = null
    },
    clearCurrentPost: (state) => {
      state.currentPost = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts = action.payload || []
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch Post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPost = action.payload
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false
        state.posts.unshift(action.payload)
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearPostsError, clearCurrentPost } = postsSlice.actions
export default postsSlice.reducer
