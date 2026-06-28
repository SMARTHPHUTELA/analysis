import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

import DashboardPage   from '@/pages/DashboardPage';

import ApiKeysPage     from '@/pages/ApiKeysPage';
import UsageLogsPage   from '@/pages/UsageLogsPage';
import SettingsPage    from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';

import '@/index.css'

// For the MVP we use a hardcoded org — in production this comes from auth
export const CURRENT_ORG_ID = import.meta.env['VITE_ORG_ID'] ?? '';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="keys"       element={<ApiKeysPage />} />
          <Route path="logs"       element={<UsageLogsPage />} />
          <Route path="settings"   element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}