import { createSlice } from "@reduxjs/toolkit"

interface UIState {
  showAuthModal: boolean
  authMode: "login" | "signup" | null
}

const initialState: UIState = {
  showAuthModal: false,
  authMode: null,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openAuthModal: (state, action) => {
      state.showAuthModal = true
      if (action.payload) {
        state.authMode = action.payload
      } else {
        state.authMode = null
      }
    },
    closeAuthModal: (state) => {
      state.showAuthModal = false
      state.authMode = null
    },
    setAuthMode: (state, action) => {
      state.authMode = action.payload
    },
  },
})

export const { openAuthModal, closeAuthModal, setAuthMode } = uiSlice.actions
export default uiSlice.reducer
