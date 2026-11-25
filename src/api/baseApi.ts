import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';
import { loggedOut, tokensRefreshed } from '../features/auth/authSlice';
import type { Session } from '../types';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** On a 401, swaps the refresh token for new tokens once and retries the request. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  if (result.error?.status !== 401) return result;

  const refreshToken = (api.getState() as RootState).auth.refreshToken;
  if (!refreshToken) {
    api.dispatch(loggedOut());
    return result;
  }
  refreshing ??= (async () => {
    const r = await rawBaseQuery({ url: '/auth/refresh', method: 'POST', body: { refreshToken } }, api, extra);
    if (r.data) {
      api.dispatch(tokensRefreshed((r.data as { data: Session }).data));
      return true;
    }
    api.dispatch(loggedOut());
    return false;
  })().finally(() => {
    refreshing = null;
  });

  if (await refreshing) result = await rawBaseQuery(args, api, extra);
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'Classes', 'Attendance', 'Homework', 'Leave', 'Announcements', 'Notifications'],
  endpoints: () => ({}),
});

/** Every API response is { data: T }. */
export const unwrap = <T,>(response: { data: T }): T => response.data;
