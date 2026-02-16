import { configureStore } from "@reduxjs/toolkit"
import walletReducer from "./slices/wallet-slice"
import uiReducer from "./slices/ui-slice"
import ngoAuthReducer from "./slices/ngo-auth-slice"
import donationReducer from "./slices/donation-slice"
import postsReducer from "./slices/posts-slice"
import donationsReducer from "./slices/donations-slice"
import statsReducer from "./slices/stats-slice"
import communitiesReducer from "./slices/community-slice"

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    ui: uiReducer,
    ngoAuth: ngoAuthReducer,
    donation: donationReducer,
    posts: postsReducer,
    donations: donationsReducer,
    stats: statsReducer,
    communities: communitiesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
