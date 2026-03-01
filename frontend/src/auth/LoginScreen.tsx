import React, { useState } from 'react';
import { authAPI, tokenStorage } from '../services/api';
import type { LoginRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(formData);

      if (response.success) {
        // Store the token

        tokenStorage.setToken(response.data.token);
        // You can redirect to dashboard or main app here
        console.log('Login successful!', response.data.user);

        // TODO: Navigate to dashboard/main app
        // navigate('/dashboard');
        navigate('/home')
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row w-full h-screen justify-center">
      <div className="w-1/2 h-full p-6 overflow-hidden max-md:hidden">
        <img
          src="../../public/image1.jpg"
          alt="Login Illustration"
          className="w-full h-full rounded-xl object-cover"
        />
      </div>

      <div className="w-1/2 flex flex-col h-screen gap-2 justify-between items-center p-5 max-sm:w-full">
        <div className="loginHeader inter">
          <div className="flex items-center gap-2">
            <img
              src="../../public/vite.svg"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-medium">MyApp</span>
          </div>
        </div>

        <div className="loginContent inter flex flex-col gap-6 ">
          <div className="text-center flex flex-col gap-5">
            <p className="playfair-display text-4xl">Welcome Back!</p>
            <p className="text-sm">
              Enter your email and password to access to your account
            </p>
          </div>

          <div>
            <form className="p-10 flex flex-col gap-4 text-xs" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label htmlFor="email" className="">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                  placeholder="Email"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <label htmlFor="password" className="">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none "
                  placeholder="Password"
                  required
                />
              </div>
              <div className="text-center flex justify-between items-center text-xs mt-2 max-sm:gap-2 ">
                <label className="flex items-center gap-2 max-sm:text-left">
                  <input type="checkbox" className="w-4 h-4" />
                  Remember me
                </label>
                <a
                  href="/forgot-password"
                  className="hover:underline max-sm:text-right"
                >
                  Forgot Password?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-2 rounded-lg transition-colors ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="flex items-center my-4">
                <hr className="flex grow border-t border-gray-300" />
                <span className="mx-2 text-gray-500">or</span>
                <hr className="flex grow border-t border-gray-300" />
              </div>
              <button
                type="button"
                className="bg-white text-black border border-gray-400 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign in with Google
              </button>
            </form>
          </div>
        </div>

        <div className="loginFooter inter text-center">
          <p className="text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-bold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
