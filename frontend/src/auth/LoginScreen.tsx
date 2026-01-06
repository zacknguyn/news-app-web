const LoginScreen: React.FC = () => {
  return (
    <div className="flex flex-row h-screen gap-2">
      {/* IMAGE SECTION */}
      <div className="m-5 rounded-3xl w-1/2 bg-blue-500 flex items-center justify-center overflow-hidden">
        <img
          src="../../public/image1.jpg"
          alt="Picture1?"
          className="object-cover w-full h-full"
        />
      </div>

      {/* CONTENT SECTION */}
      <div className="w-1/2 p-10 flex flex-col gap-10 items-center justify-between">
        {/* CONTENT'S HEADER */}
        <div className="flex flex-row gap-2 justify-center items-center">
          <img
            src="../../public/vite.svg"
            alt="MyApp Logo"
            className="w-10 h-10"
          />
          <span className="text-xl font-bold playfair-display">MyApp</span>
        </div>

        {/* CONTENT'S CONTENT */}
        <div className="w-100 flex flex-col gap-10 items-center justify-center">
          <div className="text-center">
            <h1 className="playfair-display text-2xl mb-4">Welcome back!</h1>
            <h5 className="inter font-normal">
              Enter your email and password to access your account
            </h5>
          </div>

          <form className="inter flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-3">
              <h3 className="font-medium">Login</h3>
              <input
                type="email"
                placeholder="Email"
                className="text-xs p-2 transition-colors  bg-gray-50 rounded hover:bg-gray-300 focus:bg-gray-300 hover:outline-none focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-medium">Password</h3>
              <input
                type="password"
                placeholder="Password"
                className="text-xs p-2 transition-colors  bg-gray-50 rounded hover:bg-gray-300 focus:bg-gray-300 hover:outline-none focus:outline-none"
              />
            </div>
            <div className="inter flex justify-between text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="">Remember me</span>
              </label>

              <a href="#" className=" text-black hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="mt-10 p-3 text-sm text-white bg-black transition-colors cursor-pointer rounded-xl hover:bg-gray-300 hover:text-gray-950 hover:font-bold"
            >
              Sign In
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-3 p-3 text-sm transition-colors cursor-pointer rounded-xl hover:bg-gray-300"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>
        </div>

        {/* CONTENT'S FOOTER */}
        <div>
          <p className="text-center text-xs inter">
            Don't have an account?{" "}
            <a href="#" className="text-black font-bold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
