import { configureStore } from "@reduxjs/toolkit"
import walletReducer from "./slices/wallet-slice"
import uiReducer from "./slices/ui-slice"
import ngoAuthReducer from "./slices/ngo-auth-slice"
import donationReducer from "./slices/donation-slice"

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    ui: uiReducer,
    ngoAuth: ngoAuthReducer,
    donation: donationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
