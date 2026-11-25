import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation, useLoginMutation, useRegisterMutation, useResetPasswordMutation } from '../api/teacherApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert, Button, Card, Field, Tabs } from '../components/ui';
import { sessionStarted } from '../features/auth/authSlice';
import { errorMessage } from '../lib/utils';
import type { Session } from '../types';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [subjects, setSubjects] = useState('');
  const [qualification, setQualification] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');

  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const [forgot, forgotState] = useForgotPasswordMutation();
  const [reset, resetState] = useResetPasswordMutation();

  if (accessToken && user) return <Navigate to={user.status === 'approved' ? '/' : '/pending'} replace />;

  const start = (s: Session) => {
    dispatch(sessionStarted(s));
    navigate(s.user.status === 'approved' ? '/' : '/pending');
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    const s = await login({ phone, password }).unwrap().catch(() => null);
    if (s) start(s);
  };
  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    const s = await register({
      name,
      phone,
      password,
      schoolCode,
      subjects: subjects.split(',').map((x) => x.trim()).filter(Boolean),
      qualification: qualification || undefined,
    })
      .unwrap()
      .catch(() => null);
    if (s) start(s);
  };
  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await forgot({ phone }).unwrap().catch(() => null);
    if (ok !== null) {
      setInfo('If this number is registered, a 6-digit code has been sent by SMS.');
      setMode('reset');
    }
  };
  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await reset({ phone, code, newPassword: password }).unwrap().catch(() => null);
    if (ok !== null) {
      setInfo('Password changed. Sign in with your new password.');
      setPassword('');
      setMode('login');
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>Teacher app</h1>
        <p className="muted">Timetable, attendance, homework and leave.</p>
        {(mode === 'login' || mode === 'register') && (
          <Tabs
            value={mode}
            onChange={(m) => { setInfo(''); setMode(m); }}
            tabs={[
              { value: 'login', label: 'Sign in' },
              { value: 'register', label: 'New teacher' },
            ]}
          />
        )}
        <div className="stack">
          <Alert kind="success">{info}</Alert>

          {mode === 'login' && (
            <form className="stack" onSubmit={onLogin}>
              <Field label="Mobile number">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="username" required />
              </Field>
              <Field label="Password">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </Field>
              <Alert>{errorMessage(loginState.error)}</Alert>
              <Button className="block" loading={loginState.isLoading}>
                Sign in
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode('forgot')}>
                Forgot password?
              </Button>
            </form>
          )}

          {mode === 'register' && (
            <form className="stack" onSubmit={onRegister}>
              <p className="muted small">The school office checks and approves your request. Until then you cannot see any school data.</p>
              <Field label="School code" hint="Ask your school office">
                <input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} required />
              </Field>
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </Field>
              <Field label="Mobile number">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required />
              </Field>
              <Field label="Subjects" hint="Comma separated, e.g. Maths, Science">
                <input value={subjects} onChange={(e) => setSubjects(e.target.value)} />
              </Field>
              <Field label="Qualification (optional)">
                <input value={qualification} onChange={(e) => setQualification(e.target.value)} />
              </Field>
              <Field label="Create a password" hint="At least 8 characters">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
              </Field>
              <Alert>{errorMessage(registerState.error)}</Alert>
              <Button className="block" loading={registerState.isLoading}>
                Send request to school
              </Button>
            </form>
          )}

          {mode === 'forgot' && (
            <form className="stack" onSubmit={onForgot}>
              <Field label="Registered mobile number">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required />
              </Field>
              <Alert>{errorMessage(forgotState.error)}</Alert>
              <Button className="block" loading={forgotState.isLoading}>
                Send code by SMS
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode('login')}>
                Back
              </Button>
            </form>
          )}

          {mode === 'reset' && (
            <form className="stack" onSubmit={onReset}>
              <Field label="6-digit code">
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required />
              </Field>
              <Field label="New password" hint="At least 8 characters">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </Field>
              <Alert>{errorMessage(resetState.error)}</Alert>
              <Button className="block" loading={resetState.isLoading}>
                Change password
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
