import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { useLogoutMutation, useNotificationsQuery } from '../api/teacherApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loggedOut } from '../features/auth/authSlice';

const titles: Record<string, string> = {
  '/': 'Today',
  '/attendance': 'Attendance',
  '/homework': 'Homework',
  '/leave': 'Leave',
  '/alerts': 'Alerts',
};

export default function Layout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [logout] = useLogoutMutation();
  const { data: notes } = useNotificationsQuery(undefined, { pollingInterval: 60_000 });

  const signOut = async () => {
    if (!confirm('Sign out?')) return;
    await logout().unwrap().catch(() => null);
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  const tabs = [
    { to: '/', icon: '🗓️', label: 'Today' },
    { to: '/attendance', icon: '✅', label: 'Attendance' },
    { to: '/homework', icon: '📚', label: 'Homework' },
    { to: '/leave', icon: '🏖️', label: 'Leave' },
    { to: '/alerts', icon: '🔔', label: 'Alerts', count: notes?.unreadCount },
  ];

  return (
    <div className="mobile-shell">
      <header className="mobile-top">
        <h1>{titles[pathname] ?? 'Teacher'}</h1>
        <span className="small" style={{ opacity: 0.85 }}>
          {user?.schoolName}
        </span>
        <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={signOut}>
          Sign out
        </button>
      </header>
      <div className="mobile-content">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon">{t.icon}</span>
              {t.label}
              {t.count ? <span className="dot">{t.count}</span> : null}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
