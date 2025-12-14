'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

type LoginStep = 'email' | 'password' | 'verification-code' | 'set-password';

export default function LoginPage() {
  const router = useRouter();
  
  // State pentru flow-ul de autentificare
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  // Pasul 1: Verificare email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await authService.checkEmail(email.toLowerCase());
      
      if (!result.exists) {
        setError(result.message || 'Email-ul nu există în sistem. Contactează administratorul pentru a fi adăugat.');
        return;
      }

      setHasPassword(result.has_password);
      
      if (result.has_password) {
        // Utilizatorul are parolă - trece la pasul de introducere parolă
        setStep('password');
        setMessage('');
      } else {
        // Utilizatorul nu are parolă - trimite cod de verificare
        await handleSendVerificationCode();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la verificarea email-ului. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Trimite cod de verificare
  const handleSendVerificationCode = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await authService.sendVerificationCode(email.toLowerCase());
      setMessage(result.message || 'Cod de verificare trimis cu succes pe email.');
      setStep('verification-code');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la trimiterea codului de verificare. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Verifică codul și setează parola
  const handleVerifyCodeAndSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validări
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setError('Codul de verificare trebuie să fie format din exact 6 cifre.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyCodeAndSetPassword(
        email.toLowerCase(),
        verificationCode,
        newPassword
      );

      // Salvează token-ul
      authService.setToken(response.access_token);

      // Verifică rolul - doar admin poate accesa acest client
      if (response.role !== 'admin') {
        setError('Acces restricționat. Doar administratorii pot accesa acest panou.');
        authService.logout();
        return;
      }

      // Redirecționează către dashboard admin
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Cod invalid sau eroare la setarea parolei. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Login normal (când utilizatorul are deja parolă)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        username: email.toLowerCase(),
        password,
      });

      // Salvează token-ul
      authService.setToken(response.access_token);

      // Verifică rolul - doar admin poate accesa acest client
      if (response.role !== 'admin') {
        setError('Acces restricționat. Doar administratorii pot accesa acest panou.');
        authService.logout();
        return;
      }

      // Redirecționează către dashboard admin
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email sau parolă incorectă. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setError('');
    setMessage('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleBackToPassword = () => {
    setStep('password');
    setError('');
    setMessage('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'black',
          }}
        >
          {step === 'email' && 'Autentificare Admin'}
          {step === 'password' && 'Introdu parola'}
          {step === 'verification-code' && 'Introdu codul de verificare'}
          {step === 'set-password' && 'Setează parola'}
        </h1>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#e7f3ff',
              color: '#0066cc',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}

        {/* Pasul 1: Introducere email */}
        {step === 'email' && (
          <form onSubmit={handleCheckEmail}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  color: 'black',
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                }}
                placeholder="Introdu email-ul"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : 'green',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '1rem',
              }}
            >
              {loading ? 'Se verifică...' : 'Continuă'}
            </button>
          </form>
        )}

        {/* Pasul 2a: Introducere parolă (când utilizatorul are deja parolă) */}
        {step === 'password' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  color: '#666',
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: '#f5f5f5',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Parolă
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    color: 'black',
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Introdu parola"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '1.1rem',
                    userSelect: 'none',
                  }}
                  title={showPassword ? 'Ascunde parola' : 'Afișează parola'}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  👁
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : 'green',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              {loading ? 'Se autentifică...' : 'Autentificare'}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'white',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '1rem',
              }}
            >
              ← Înapoi
            </button>
          </form>
        )}

        {/* Pasul 2b: Introducere cod de verificare și parolă nouă */}
        {step === 'verification-code' && (
          <form onSubmit={handleVerifyCodeAndSetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  color: '#666',
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: '#f5f5f5',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Cod de verificare (6 cifre)
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                disabled={loading}
                maxLength={6}
                style={{
                  color: 'black',
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1.5rem',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace',
                }}
                placeholder="000000"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Parolă nouă
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  style={{
                    color: 'black',
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Minim 6 caractere"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '1.1rem',
                    userSelect: 'none',
                  }}
                  title={showNewPassword ? 'Ascunde parola' : 'Afișează parola'}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  👁
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: 'black',
                }}
              >
                Confirmă parola
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                style={{
                  color: 'black',
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                }}
                placeholder="Confirmă parola"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : 'green',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              {loading ? 'Se setează parola...' : 'Setează parola și autentifică-te'}
            </button>

            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'white',
                color: '#0066cc',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Retrimite codul
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'white',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '1rem',
              }}
            >
              ← Înapoi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
