import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { useMeQuery } from '../api/teacherApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert, Button, Card } from '../components/ui';
import { loggedOut, tokensRefreshed } from '../features/auth/authSlice';

/** Shown until the school approves the teacher (T1). Checks again every 30 seconds. */
export default function PendingPage() {
  const auth = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: me, refetch, isFetching } = useMeQuery(undefined, { skip: !auth.accessToken, pollingInterval: 30_000 });

  useEffect(() => {
    if (me && auth.accessToken && auth.refreshToken && me.status !== auth.user?.status) {
      dispatch(tokensRefreshed({ accessToken: auth.accessToken, refreshToken: auth.refreshToken, user: me }));
    }
  }, [me, auth, dispatch]);

  if (!auth.accessToken || !auth.user) return <Navigate to="/login" replace />;
  if (auth.user.status === 'approved') return <Navigate to="/" replace />;

  const signOut = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>Hello, {auth.user.name}</h1>
        {auth.user.status === 'pending' && (
          <Alert kind="info">
            Your request has been sent to <strong>{auth.user.schoolName}</strong>. You will be notified when the office approves it.
          </Alert>
        )}
        {auth.user.status === 'rejected' && <Alert>The school did not approve your request. Please contact the school office.</Alert>}
        {auth.user.status === 'deactivated' && <Alert>This account has been deactivated by the school.</Alert>}
        <div className="row" style={{ marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Check again
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
