'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // User data
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Statistics
  const [totalLinks, setTotalLinks] = useState(0);
  const [activeLinks, setActiveLinks] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Display name update
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load user profile
  useEffect(() => {
    document.title = 'My Profile - Minify';
    
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setNewDisplayName(profile.display_name);
        
        const date = new Date(profile.created_at);
        const formatted = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        setMemberSince(`Member since ${formatted}`);
      }

      setIsLoadingProfile(false);
    }

    loadProfile();
  }, [supabase, router]);

  // Real-time password validation
  useEffect(() => {
    setPasswordValidation({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  // Update display name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!newDisplayName.trim()) {
      setNameError('Display name is required');
      return;
    }

    if (newDisplayName.trim().length < 2) {
      setNameError('Display name must be at least 2 characters');
      return;
    }

    if (newDisplayName.trim().length > 50) {
      setNameError('Display name must be 50 characters or less');
      return;
    }

    if (/\d/.test(newDisplayName)) {
      setNameError('Display name cannot contain numbers');
      return;
    }

    setIsUpdatingName(true);

    try {
      const response = await fetch('/api/profile/update-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update display name');
      }

      setDisplayName(data.data.display_name);
      setNameSuccess('Display name updated successfully!');
      
      setTimeout(() => setNameSuccess(''), 5000);
    } catch (error: any) {
      setNameError(error.message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const allValid = Object.values(passwordValidation).every(v => v);
    if (!allValid) {
      setPasswordError('New password does not meet requirements');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess("Password updated successfully! You've been logged out of other devices.");
      
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Redirect to deletion confirmation page
      router.push('/account/deleted');
    } catch (error: any) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  };

  const getPasswordStrength = () => {
    const score = Object.values(passwordValidation).filter(v => v).length;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = newPassword ? getPasswordStrength() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 mr-4"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Messages */}
        {nameSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center">
            <span className="text-green-800">{nameSuccess}</span>
            <button onClick={() => setNameSuccess('')} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}
        
        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center">
            <span className="text-green-800">{passwordSuccess}</span>
            <button onClick={() => setPasswordSuccess('')} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Section 1: Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Profile Information</h2>
          
          {isLoadingProfile ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              {/* Display Name */}
              <form onSubmit={handleUpdateName} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isUpdatingName}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingName || newDisplayName === displayName}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUpdatingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {nameError && <p className="text-sm text-red-600">{nameError}</p>}
              </form>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">🔒 Email cannot be changed</p>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-600">{memberSince}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isChangingPassword}
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isChangingPassword}
              />
              
              {/* Password Strength Indicator */}
              {strength && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Password Strength:</span>
                    <span className={strength.label === 'Weak' ? 'text-red-600' : strength.label === 'Medium' ? 'text-yellow-600' : 'text-green-600'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${strength.color} h-2 rounded-full transition-all`} style={{ width: strength.width }}></div>
                  </div>
                </div>
              )}
              
              {/* Validation Checklist */}
              {newPassword && (
                <div className="mt-2 text-xs space-y-1">
                  <p className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}>
                    {passwordValidation.minLength ? '✓' : '○'} At least 8 characters
                  </p>
                  <p className={passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordValidation.hasUppercase ? '✓' : '○'} One uppercase letter
                  </p>
                  <p className={passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordValidation.hasLowercase ? '✓' : '○'} One lowercase letter
                  </p>
                  <p className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                    {passwordValidation.hasNumber ? '✓' : '○'} One number
                  </p>
                  <p className={passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                    {passwordValidation.hasSpecial ? '✓' : '○'} One special character
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isChangingPassword}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{passwordError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Section 4: Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2 text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Danger Zone
          </h2>
          <p className="text-gray-700 mb-4">
            Once deleted, your account and all links will be permanently removed after 30 days. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
          >
            Delete My Account
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">⚠️</span>
              Delete Account?
            </h3>
            
            <div className="mb-4 text-gray-700 space-y-2">
              <p className="font-medium">This will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Deactivate your account immediately</li>
                <li>Mark all your links as inactive</li>
                <li>Schedule permanent deletion in 30 days</li>
                <li>Log you out from all devices</li>
              </ul>
              <p className="text-sm mt-3">
                You can reactivate within 30 days by logging in with your credentials.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isDeleting}
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{deleteError}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}