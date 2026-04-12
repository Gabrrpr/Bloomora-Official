export default function Login() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold text-rose-500 mb-2 text-center">Bloomora</h1>
      <p className="text-center text-gray-500 mb-6">Sign in to your account</p>

      <div className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition">
          Sign In
        </button>
      </div>
    </div>
  )
}