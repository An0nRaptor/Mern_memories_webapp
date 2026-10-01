import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./features/authSlice.js";
import { api } from "./features/api.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [api.reducerPath]: api.reducer
    },
    middleware: getDefault => getDefault().concat(api.middleware)
});

// Refetch on window focus / reconnect.
setupListeners(store.dispatch);
