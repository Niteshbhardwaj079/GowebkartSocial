import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store, { fetchMe } from './store';

import LoginPage               from './pages/LoginPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import DashboardPage           from './pages/DashboardPage';
import CreatePostPage          from './pages/CreatePostPage';
import PostsPage               from './pages/PostsPage';
import CalendarPage            from './pages/CalendarPage';
import AnalyticsPage           from './pages/AnalyticsPage';
import AccountsPage            from './pages/AccountsPage';
import AdsPage                 from './pages/AdsPage';
import PlansPage               from './pages/PlansPage';
import SettingsPage            from './pages/SettingsPage';
import AdminPage               from './pages/AdminPage';
import SuperAdminPage          from './pages/SuperAdminPage';
import InboxPage               from './pages/InboxPage';
import CompanyPage             from './pages/CompanyPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import ExpirySettingsPage      from './pages/ExpirySettingsPage';
import SupportPage             from './pages/SupportPage';
import Layout from './components/layout/Layout';
import './styles/main.scss';

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppContent() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(s => s.auth);
  useEffect(() => { if (token && !isAuthenticated) dispatch(fetchMe()); }, [token, isAuthenticated, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<DashboardPage />} />
          <Route path="create"           element={<CreatePostPage />} />
          <Route path="posts"            element={<PostsPage />} />
          <Route path="calendar"         element={<CalendarPage />} />
          <Route path="inbox"            element={<InboxPage />} />
          <Route path="analytics"        element={<AnalyticsPage />} />
          <Route path="accounts"         element={<AccountsPage />} />
          <Route path="company"          element={<CompanyPage />} />
          <Route path="ads"              element={<AdsPage />} />
          <Route path="plans"            element={<PlansPage />} />
          <Route path="notifications"    element={<NotificationSettingsPage />} />
          <Route path="support"          element={<SupportPage />} />
          <Route path="settings"         element={<SettingsPage />} />
          <Route path="admin"            element={<PrivateRoute roles={['admin','superadmin']}><AdminPage /></PrivateRoute>} />
          <Route path="superadmin"       element={<PrivateRoute roles={['superadmin']}><SuperAdminPage /></PrivateRoute>} />
          <Route path="expiry-settings"  element={<PrivateRoute roles={['superadmin']}><ExpirySettingsPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={4000} theme="light" style={{ zIndex:9999, marginTop:8 }} toastStyle={{ background:"#fff", border:"1px solid #d0dce8", color:"#1a2332", boxShadow:"0 4px 20px rgba(0,0,0,0.12)", borderRadius:12, fontSize:14, fontFamily:"Inter,sans-serif" }} />
    </BrowserRouter>
  );
}

export default function App() { return <Provider store={store}><AppContent /></Provider>; }