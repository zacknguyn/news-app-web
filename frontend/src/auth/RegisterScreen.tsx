import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render register form if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registerData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    };

    try {
      const result = await register(registerData);

      if (result.success) {
        // Redirect to home after successful registration
        navigate('/home', { replace: true });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
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
        <div className="registerHeader inter">
          <div className="flex items-center gap-2">
            <img
              src="../../public/vite.svg"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-medium">MyApp</span>
          </div>
        </div>

        <div className="registerContent inter flex flex-col gap-6 max-sm:gap-8">
          <div className="text-center flex flex-col gap-5">
            <p className="playfair-display text-4xl">Sign Up Account</p>
            <p className="text-sm">
              Enter your name, email, and desired password to create your
              account
            </p>
          </div>

          <div>
            <form className="p-10 flex flex-col gap-4 text-xs" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-row gap-4 max-sm:flex-col max-sm:gap-3 max-sm:pb-4">
                <div className="flex flex-col gap-3 flex-1">
                  <label htmlFor="firstName" className="">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <label htmlFor="lastName" className="">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

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
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                  placeholder="Password"
                  required
                />
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="confirmPassword" className="">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                  placeholder="Confirm Password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-2 rounded-lg transition-colors ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>

        <div className="registerFooter inter text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-bold hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
