import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Deleted - Minify',
  description: 'Your account has been deleted',
};

export default function AccountDeletedPage() {
  // Calculate deletion date (30 days from now)
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);
  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="text-center max-w-2xl bg-white rounded-lg shadow-xl p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Thank You for Using Minify
        </h1>

        <div className="text-6xl mb-6">😔</div>

        <p className="text-xl text-gray-700 mb-6">
          We're sorry to see you go!
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <p className="text-gray-800 mb-4">
            Your account has been <strong>deactivated</strong> and is scheduled for permanent deletion on:
          </p>
          <p className="text-2xl font-bold text-blue-600 text-center mb-4">
            {formattedDate}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
          <p className="font-semibold text-gray-800 mb-2">Changed your mind?</p>
          <p className="text-gray-700 mb-4">
            You can reactivate your account within 30 days by logging in with your credentials. 
            All your active links will be restored!
          </p>
          <Link
            href="/login"
            className="inline-block w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Login to Reactivate
          </Link>
        </div>

        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
        >
          Go to Login Page
        </Link>

        <p className="text-sm text-gray-500 mt-8">
          Need help? Contact our support team at support@minify.com
        </p>
      </div>
    </div>
  );
}