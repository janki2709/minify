'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ReactivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [deletedAt, setDeletedAt] = useState('');
  const [deletionDate, setDeletionDate] = useState('');
  
  const [password, setPassword] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Reactivate Account - Minify';
    
    // Get email and deletedAt from query params (passed from login)
    const emailParam = searchParams.get('email');
    const deletedAtParam = searchParams.get('deletedAt');

    if (!emailParam || !deletedAtParam) {
      // No reactivation data, redirect to login
      router.push('/login');
      return;
    }

    setEmail(emailParam);
    setDeletedAt(deletedAtParam);

    // Calculate deletion date (30 days from deleted_at)
    const deleted = new Date(deletedAtParam);
    const deletion = new Date(deleted);
    deletion.setDate(deletion.getDate() + 30);
    
    setDeletionDate(deletion.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }));
  }, [searchParams, router]);

  const handleReactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    setIsReactivating(true);

    try {
      const response = await fetch('/api/account/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate account');
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?reactivated=true');
    } catch (error: any) {
      setError(error.message);
      setIsReactivating(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔄</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reactivate Your Account
          </h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800 mb-2">
            Your account <strong>{email}</strong> was deactivated on{' '}
            {new Date(deletedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {' '}and is scheduled for permanent deletion on:
          </p>
          <p className="text-2xl font-bold text-orange-600 text-center my-3">
            {deletionDate}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Would you like to reactivate your account?
          </h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="font-medium text-gray-800 mb-2">If you reactivate your account:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Your profile will be restored
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Your active links will work again
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                You can create new links
              </li>
            </ul>
          </div>

          <form onSubmit={handleReactivate} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm your password to reactivate:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={isReactivating}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isReactivating || !password}
              className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all"
            >
              {isReactivating ? 'Reactivating...' : 'Reactivate Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}