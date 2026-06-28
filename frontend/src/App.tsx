// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import Layout from '@/components/layout/Layout';

// import DashboardPage   from '@/pages/DashboardPage';

// import ApiKeysPage     from '@/pages/ApiKeysPage';
// import UsageLogsPage   from '@/pages/UsageLogsPage';
// import SettingsPage    from '@/pages/SettingsPage';
// import AdminPage from '@/pages/AdminPage';

// import '@/index.css'

// // For the MVP we use a hardcoded org — in production this comes from auth
// export const CURRENT_ORG_ID = import.meta.env['VITE_ORG_ID'] ?? '';

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Layout />}>
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard"  element={<DashboardPage />} />
//           <Route path="keys"       element={<ApiKeysPage />} />
//           <Route path="logs"       element={<UsageLogsPage />} />
//           <Route path="settings"   element={<SettingsPage />} />
//           <Route path="admin" element={<AdminPage />} />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }



import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }       from '@/context/AuthContext';
import ProtectedRoute         from '@/components/ProtectedRoute';
import Layout                 from '@/components/layout/Layout';
import LoginPage              from '@/pages/LoginPage';
import RegisterPage           from '@/pages/RegisterPage';
import ForgotPasswordPage     from '@/pages/ForgotPasswordPage';
import ResetPasswordPage      from '@/pages/ResetPasswordPage';
import DashboardPage          from '@/pages/DashboardPage';
import ApiKeysPage            from '@/pages/ApiKeysPage';
import UsageLogsPage          from '@/pages/UsageLogsPage';
import SettingsPage           from '@/pages/SettingsPage';
import AdminPage              from '@/pages/AdminPage';

import '@/index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="keys"      element={<ApiKeysPage />} />
            <Route path="logs"      element={<UsageLogsPage />} />
            <Route path="settings"  element={<SettingsPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}