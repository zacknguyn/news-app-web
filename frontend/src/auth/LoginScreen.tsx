const LoginScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-screen gap-2 justify-between items-center p-5">
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

      <div className="loginContent inter flex flex-col gap-6">
        <div className="text-center flex flex-col gap-5">
          <p className="playfair-display text-4xl">Welcome Back!</p>
          <p className="text-sm">
            Enter your email and password to access to your account
          </p>
        </div>

        <div>
          <form className="p-10 flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-3">
              <label htmlFor="email" className="">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                placeholder="Email"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="password" className="">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none "
                placeholder="Password"
              />
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-blue-500 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              className="mt-4 bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign In
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

      <div className="loginFooter inter">
        <p className="text-sm">
          Don't have an account?{" "}
          <a href="/signup" className="text-bold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
