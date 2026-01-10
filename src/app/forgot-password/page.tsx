'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      await forgotPassword(email, redirectUrl);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-accent mb-2">Recover Password</h1>
          <p className="text-muted text-sm">Enter your email to receive instructions.</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✉️
            </div>
            <h3 className="font-bold text-darkText dark:text-lightText">Email Sent!</h3>
            <p className="text-sm text-muted">
              If the email <b>{email}</b> is registered, you will receive a link to reset your password shortly.
            </p>
            <Link href="/login" className="block w-full py-3 bg-secondary dark:bg-gray-700 text-muted font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-6">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                placeholder="your@email.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-heading font-bold rounded-xl transition-all shadow-glow disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Link'}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted hover:text-darkText dark:hover:text-lightText transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}