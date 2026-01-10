'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser, loginUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currency: 'EUR',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Password Validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must have at least 8 characters, 1 uppercase letter, and 1 number.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create User
      const payload = {
        email: formData.email,
        password: formData.password,
        profile: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          preferred_currency: formData.currency
        }
      };

      await registerUser(payload);

      // 2. Auto Login
      const loginData = await loginUser(formData.email, formData.password);
      
      // 3. Save Token & Redirect
      login(loginData.access_token);
      router.push('/');

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'An error occurred while creating account.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-accent mb-2">Join MoneyMap</h1>
          <p className="text-muted">Create your personalized account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FULL NAME */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">First Name</label>
              <input 
                name="firstName" required
                value={formData.firstName} onChange={handleChange}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Last Name</label>
              <input 
                name="lastName" required
                value={formData.lastName} onChange={handleChange}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Email</label>
            <input 
              name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="your@email.com"
            />
          </div>

          {/* CURRENCY */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Main Currency</label>
            <select 
              name="currency" 
              value={formData.currency} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
              <option value="GBP">Pound (£)</option>
            </select>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Password</label>
            <input 
              name="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="Min. 8 chars, 1 Uppercase, 1 Number"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Confirm Password</label>
            <input 
              name="confirmPassword" type="password" required
              value={formData.confirmPassword} onChange={handleChange}
              className={`w-full p-3 bg-secondary dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 transition-all text-darkText dark:text-lightText ${
                formData.confirmPassword && formData.password !== formData.confirmPassword 
                  ? 'border-error focus:ring-error' 
                  : 'border-gray-200 dark:border-gray-600 focus:ring-accent'
              }`}
              placeholder="Repeat password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-error mt-1">Passwords do not match.</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-heading font-bold rounded-xl transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link href="/login" className="text-accent hover:underline font-bold">Login</Link>
        </div>
      </div>
    </main>
  );
}