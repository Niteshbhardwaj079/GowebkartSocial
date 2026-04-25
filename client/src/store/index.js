import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, postAPI, analyticsAPI, socialAPI } from '../services/api';
import { toast } from 'react-toastify';

// ═══════════════════════════════════════════
// AUTH SLICE
// ═══════════════════════════════════════════
export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});

export const demoLogin = createAsyncThunk('auth/demo', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.demo();
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.me();
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    token:   localStorage.getItem('token'),
    loading: false,
    error:   null,
    isAuthenticated: !!localStorage.getItem('token')
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user    = null;
      state.token   = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (b) => {
    const pending  = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };
    const fulfilled = (s, a) => {
      s.loading = false;
      s.user    = a.payload.user;
      s.token   = a.payload.token;
      s.isAuthenticated = true;
    };
    b.addCase(loginUser.pending, pending)
     .addCase(loginUser.fulfilled, (s, a) => { fulfilled(s, a); toast.success('Login successful! 🎉'); })
     .addCase(loginUser.rejected, rejected)
     .addCase(registerUser.pending, pending)
     .addCase(registerUser.fulfilled, (s, a) => { fulfilled(s, a); toast.success('Welcome! Account created 🎉'); })
     .addCase(registerUser.rejected, rejected)
     .addCase(demoLogin.pending, pending)
     .addCase(demoLogin.fulfilled, (s, a) => { fulfilled(s, a); toast.success('Demo mode active 🎭'); })
     .addCase(demoLogin.rejected, rejected)
     .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload.user; s.isAuthenticated = true; });
  }
});

// ═══════════════════════════════════════════
// POSTS SLICE
// ═══════════════════════════════════════════
export const fetchPosts = createAsyncThunk('posts/fetchAll', async (params = {}) => {
  const res = await postAPI.getAll(params);
  return res.data;
});

export const createPost = createAsyncThunk('posts/create', async (data, { rejectWithValue }) => {
  try {
    const res = await postAPI.create(data);
    toast.success('Post created! 🎉');
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const deletePost = createAsyncThunk('posts/delete', async (id) => {
  await postAPI.delete(id);
  toast.success('Post deleted');
  return id;
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [], loading: false, error: null, pagination: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPosts.pending,   (s) => { s.loading = true; })
     .addCase(fetchPosts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.posts; s.pagination = a.payload.pagination; })
     .addCase(fetchPosts.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createPost.fulfilled, (s, a) => { s.items.unshift(a.payload.post); })
     .addCase(deletePost.fulfilled, (s, a) => { s.items = s.items.filter(p => p._id !== a.payload); });
  }
});

// ═══════════════════════════════════════════
// ANALYTICS SLICE
// ═══════════════════════════════════════════
export const fetchDashboard = createAsyncThunk('analytics/dashboard', async () => {
  const res = await analyticsAPI.dashboard();
  return res.data;
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { data: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.pending,   (s) => { s.loading = true; })
     .addCase(fetchDashboard.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
     .addCase(fetchDashboard.rejected,  (s) => { s.loading = false; });
  }
});

// ═══════════════════════════════════════════
// SOCIAL ACCOUNTS SLICE
// ═══════════════════════════════════════════
export const fetchAccounts = createAsyncThunk('social/fetchAccounts', async () => {
  const res = await socialAPI.getAccounts();
  return res.data;
});

const socialSlice = createSlice({
  name: 'social',
  initialState: { accounts: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAccounts.pending,   (s) => { s.loading = true; })
     .addCase(fetchAccounts.fulfilled, (s, a) => { s.loading = false; s.accounts = a.payload.accounts; })
     .addCase(fetchAccounts.rejected,  (s) => { s.loading = false; });
  }
});

// ═══════════════════════════════════════════
// UI SLICE (sidebar, theme, etc.)
// ═══════════════════════════════════════════
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, theme: 'dark', language: 'en' },
  reducers: {
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen; },
    setTheme:      (s, a) => { s.theme = a.payload; },
    setLanguage:   (s, a) => { s.language = a.payload; },
  }
});

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════
export const { logout, clearError } = authSlice.actions;
export const { toggleSidebar, setTheme, setLanguage } = uiSlice.actions;

const store = configureStore({
  reducer: {
    auth:      authSlice.reducer,
    posts:     postsSlice.reducer,
    analytics: analyticsSlice.reducer,
    social:    socialSlice.reducer,
    ui:        uiSlice.reducer,
  }
});

export default store;
