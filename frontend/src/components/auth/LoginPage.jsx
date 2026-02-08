import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from './Authcontext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://food-delivery-backend-fiuj.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data
        login({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        }, data.token);

        // Navigate based on role
        if (data.role === 'customer') {
          navigate('/restaurants');
        } else if (data.role === 'restaurant') {
          navigate('/restaurant-dashboard');
        } else if (data.role === 'delivery') {
          navigate('/delivery-dashboard');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">FoodExpress</h1>
            <p className="text-blue-100 text-sm">Delicious food at your doorstep</p>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Welcome Back
            </h2>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="mt-5 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;