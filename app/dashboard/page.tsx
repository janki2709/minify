'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Link {
  id: string;
  slug: string;
  original_url: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // User state
  const [userEmail, setUserEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Link creation state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createdLink, setCreatedLink] = useState<Link | null>(null);

  // Links list state
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [linksError, setLinksError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Action states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // Fetch display name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
      }
    }

    loadUser();
  }, [supabase, router]);

  // Load links
  const loadLinks = async (page: number = 1) => {
    setIsLoadingLinks(true);
    setLinksError('');

    try {
      const response = await fetch(`/api/links/list?page=${page}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load links');
      }

      setLinks(data.links);
      setPagination(data.pagination);
    } catch (error: any) {
      setLinksError(error.message);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  // Create link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreatedLink(null);

    if (!originalUrl.trim()) {
      setCreateError('Please enter a URL');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          customSlug: customSlug.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link');
      }

      setCreateSuccess('Link created successfully!');
      setCreatedLink(data.link);
      setOriginalUrl('');
      setCustomSlug('');

      // Reload links
      loadLinks(pagination.page);

      // Clear success message after 10 seconds
      setTimeout(() => {
        setCreateSuccess('');
        setCreatedLink(null);
      }, 10000);
    } catch (error: any) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy link
  const handleCopyLink = async (slug: string, linkId: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extend link
  const handleExtendLink = async (linkId: string) => {
    setExtendingId(linkId);

    try {
      const response = await fetch('/api/links/extend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extend link');
      }

      // Reload links
      loadLinks(pagination.page);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setExtendingId(null);
    }
  };

  // Delete link
  const handleDeleteLink = async (linkId: string) => {
    setDeletingId(linkId);

    try {
      const response = await fetch('/api/links/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete link');
      }

      // Reload links
      loadLinks(pagination.page);
      setDeleteConfirmId(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get status
  const getStatus = (expiresAt: string, isActive: boolean) => {
    if (!isActive) return 'inactive';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring-soon';
    return 'active';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Minify</h1>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <span className="font-medium">{displayName || 'User'}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    {userEmail}
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Link Creation Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Short Link</h2>
          <p className="text-gray-600 text-sm mb-6">Convert long URLs into short, shareable links</p>

          {/* Success Message */}
          {createSuccess && createdLink && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium mb-2">{createSuccess}</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-white border rounded text-sm">
                  {window.location.origin}/{createdLink.slug}
                </code>
                <button
                  onClick={() => handleCopyLink(createdLink.slug, createdLink.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copiedId === createdLink.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Expires on {formatDate(createdLink.expires_at)}
              </p>
            </div>
          )}

          {/* Error Message */}
          {createError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{createError}</p>
            </div>
          )}

          <form onSubmit={handleCreateLink} className="space-y-4">
            {/* Original URL */}
            <div>
              <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your long URL
              </label>
              <input
                type="url"
                id="originalUrl"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very/long/url/here"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>

            {/* Custom Slug */}
            <div>
              <label htmlFor="customSlug" className="block text-sm font-medium text-gray-700 mb-1">
                Custom slug (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Leave empty for auto-generated slug. 4-20 characters, letters, numbers, and hyphens only.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">minify.app/</span>
                <input
                  type="text"
                  id="customSlug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="your-custom-slug"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Shorten Link'}
            </button>
          </form>
        </div>

        {/* Links Management Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">
              Your Links {pagination.total > 0 && `(${pagination.total} links)`}
            </h2>
          </div>

          {/* Loading State */}
          {isLoadingLinks && (
            <div className="p-8 text-center text-gray-500">
              Loading your links...
            </div>
          )}

          {/* Error State */}
          {linksError && (
            <div className="p-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">{linksError}</p>
                <button
                  onClick={() => loadLinks(pagination.page)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingLinks && !linksError && links.length === 0 && (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">You haven't created any links yet</h3>
              <p className="mt-2 text-gray-500">Create your first short link above to get started!</p>
            </div>
          )}

          {/* Table */}
          {!isLoadingLinks && !linksError && links.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {links.map((link) => {
                      const status = getStatus(link.expires_at, link.is_active);
                      return (
                        <tr key={link.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={`/${link.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {link.slug}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 truncate max-w-xs" title={link.original_url}>
                              {link.original_url}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(link.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(link.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {status === 'active' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                            {status === 'expiring-soon' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Expiring Soon
                              </span>
                            )}
                            {status === 'expired' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                            {status === 'inactive' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => handleCopyLink(link.slug, link.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Copy link"
                            >
                              {copiedId === link.id ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button
                              onClick={() => handleExtendLink(link.id)}
                              disabled={extendingId === link.id}
                              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                              title="Extend by 7 days"
                            >
                              {extendingId === link.id ? '⏳' : '🕐 Extend'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(link.id)}
                              disabled={deletingId === link.id}
                              className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                              title="Delete link"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} links
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadLinks(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => loadLinks(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this link? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLink(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}