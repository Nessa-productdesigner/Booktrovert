import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as AuthMode) || 'login';

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [is13OrOlder, setIs13OrOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const switchMode = (newMode: AuthMode) => {
    setSearchParams({ mode: newMode });
    setError(null);
    setEmail('');
    setEmailTouched(false);
    setPassword('');
    setIs13OrOlder(false);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }
      navigate('/shelf', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!is13OrOlder) {
      setError('You must confirm you are 13 years of age or older to register.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { is_13_or_older: true, onboarding_complete: false } }
      });

      if (signUpError) {
        if (signUpError.status === 409) throw new Error('An account with this email already exists.');
        throw signUpError;
      }

      if (data.session) {
        navigate('/onboarding', { replace: true });
      } else {
        setError('Registration successful! Please check your email to confirm your account.');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const title = isLogin ? 'Welcome back' : 'Create your account';
  const subtitle = isLogin ? 'Log in to access your reading shelves.' : 'Start tracking and discovering your next favorite book.';

  return (
    <AuthLayout title={title} subtitle={subtitle} showLogo={false}>
      {error && <div className="auth-form__error">{error}</div>}

      <form className="auth-form" onSubmit={isLogin ? handleLogin : handleSignup}>
        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="email">{isLogin ? 'Email address' : 'Enter email address'}</label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            className="auth-form__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            required
            placeholder="you@example.com"
          />
          {emailTouched && !isValidEmail && (
            <span className="auth-form__hint">use a valid email address</span>
          )}
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="password">{isLogin ? 'Password' : 'Enter password'}</label>
          <input
            id="password"
            type="password"
            className="auth-form__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
          />
          {!isLogin && password.length > 0 && password.length < 8 && (
            <span className="auth-form__hint">Password must be at least 8 characters</span>
          )}
        </div>

        {!isLogin && (
          <div className="auth-form__checkbox-group">
            <input
              id="coppa"
              type="checkbox"
              className="auth-form__checkbox"
              checked={is13OrOlder}
              onChange={(e) => setIs13OrOlder(e.target.checked)}
              required
            />
            <label htmlFor="coppa" className="auth-form__checkbox-label">
              I confirm I am 13 years of age or older, in compliance with COPPA regulations.
            </label>
          </div>
        )}

        <button
          type="submit"
          className="auth-form__button"
          disabled={loading || (!isLogin && !is13OrOlder)}
        >
          {loading
            ? (isLogin ? 'Logging in...' : 'Creating account...')
            : (isLogin ? 'Log in' : 'Sign up')}
        </button>
      </form>

      <div className="auth-form__footer">
        {isLogin ? (
          <>
            Don't have an account?{' '}
            <button
              onClick={() => switchMode('signup')}
              className="auth-form__link-btn"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => switchMode('login')}
              className="auth-form__link-btn"
            >
              Log in
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
