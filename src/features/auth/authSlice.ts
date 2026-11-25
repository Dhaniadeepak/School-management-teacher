import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, Session } from '../../types';

export const AUTH_STORAGE_KEY = 'school-teacher-auth';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

function load(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    /* ignore broken storage */
  }
  return { accessToken: null, refreshToken: null, user: null };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: load,
  reducers: {
    sessionStarted(_state, action: PayloadAction<Session>) {
      return { ...action.payload };
    },
    tokensRefreshed(state, action: PayloadAction<Session>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    loggedOut() {
      return { accessToken: null, refreshToken: null, user: null };
    },
  },
});

export const { sessionStarted, tokensRefreshed, loggedOut } = authSlice.actions;
export default authSlice.reducer;
