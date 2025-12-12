export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to FocusHub</h1>
      <p className="text-gray-600 mb-6">Your personal productivity and focus companion.</p>
      <a href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Get Started
      </a>
    </div>
  );
}
