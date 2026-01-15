import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black cyber-grid flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-blue-950/40"></div>
      <div className="bg-gradient-to-br from-black/95 via-purple-950/50 to-black/95 backdrop-blur-sm rounded-none shadow-2xl border-4 border-cyan-500 neon-border-cyan p-10 w-full max-w-md relative z-10">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-fuchsia-500"></div>
        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-fuchsia-500"></div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LogIn className="w-20 h-20 text-cyan-400 drop-shadow-glow" />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-fuchsia-500 mb-3 tracking-wider neon-text-cyan uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Daily Consistency Tracker
          </h1>
          <p className="text-cyan-300 text-lg uppercase tracking-widest">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-cyan-300 mb-2 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 bg-black/70 border-2 border-gray-700 rounded-none text-cyan-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:neon-border-cyan transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-cyan-300 mb-2 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-4 bg-black/70 border-2 border-gray-700 rounded-none text-cyan-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:neon-border-cyan transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 text-red-300 px-4 py-3 rounded-none text-sm uppercase tracking-wide">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white font-bold py-4 rounded-none transition-all duration-300 shadow-lg neon-border-pink border-2 border-fuchsia-500 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed relative"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-fuchsia-400"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-fuchsia-400"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-fuchsia-400 hover:text-cyan-400 text-sm transition-colors uppercase tracking-wide"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
