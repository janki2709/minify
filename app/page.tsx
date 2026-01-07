import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <main className="max-w-4xl w-full text-center">
        {/* Logo and Tagline */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-blue-600 mb-4">
            Minify
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 font-medium">
            Shorten your links, expand your reach
          </p>
        </div>

        {/* Description */}
        <div className="mb-12 max-w-2xl mx-auto">
          <p className="text-lg text-gray-600">
            Transform long, complex URLs into short, shareable links. 
            Perfect for social media, marketing campaigns, and anywhere you need clean, trackable links.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast & Simple</h3>
            <p className="text-gray-600">
              Create short links in seconds with our easy-to-use interface
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your links are protected with industry-standard security
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Slugs</h3>
            <p className="text-gray-600">
              Create memorable links with custom slugs or use auto-generated ones
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-gray-500 text-sm">
          <p>&copy; 2026 Minify. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}