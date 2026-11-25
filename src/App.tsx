import { useEffect, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import Layout from './components/Layout';
import { syncAttendanceQueue } from './lib/offline';
import AlertsPage from './pages/AlertsPage';
import AttendancePage from './pages/AttendancePage';
import DashboardPage from './pages/DashboardPage';
import HomeworkPage from './pages/HomeworkPage';
import LeavePage from './pages/LeavePage';
import LoginPage from './pages/LoginPage';
import PendingPage from './pages/PendingPage';

function RequireTeacher({ children }: { children: ReactElement }) {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  if (!accessToken || user?.role !== 'teacher') return <Navigate to="/login" replace />;
  if (user.status !== 'approved') return <Navigate to="/pending" replace />;
  return children;
}

export default function App() {
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((s) => !!s.auth.accessToken);

  // Send attendance saved while offline as soon as the connection returns
  useEffect(() => {
    if (!signedIn) return;
    const sync = () => void syncAttendanceQueue(dispatch);
    sync();
    window.addEventListener('online', sync);
    const timer = setInterval(sync, 60_000);
    return () => {
      window.removeEventListener('online', sync);
      clearInterval(timer);
    };
  }, [dispatch, signedIn]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route
        element={
          <RequireTeacher>
            <Layout />
          </RequireTeacher>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
