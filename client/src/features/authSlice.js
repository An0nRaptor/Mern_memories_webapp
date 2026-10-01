import { createSlice } from "@reduxjs/toolkit";

const KEY = "memories_session";

function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || { token: null, user: null };
    } catch {
        return { token: null, user: null };
    }
}

function save(state) {
    try {
        if (state.token) localStorage.setItem(KEY, JSON.stringify(state));
        else localStorage.removeItem(KEY);
    } catch {
        /* storage blocked: session lasts for this tab only */
    }
}

const authSlice = createSlice({
    name: "auth",
    initialState: load(),
    reducers: {
        signedIn(state, { payload }) {
            state.token = payload.token;
            state.user = payload.user;
            save(state);
        },
        userUpdated(state, { payload }) {
            state.user = payload;
            save(state);
        },
        signedOut(state) {
            state.token = null;
            state.user = null;
            save(state);
        }
    }
});

export const { signedIn, userUpdated, signedOut } = authSlice.actions;
export const selectUser = state => state.auth.user;
export default authSlice.reducer;
