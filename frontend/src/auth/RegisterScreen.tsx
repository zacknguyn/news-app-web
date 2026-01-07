const RegisterScreen: React.FC = () => {
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
            <form className="p-10 flex flex-col gap-4 text-xs">
              <div className="flex flex-row gap-4 max-sm:flex-col max-sm:gap-3 max-sm:pb-4">
                <div className="flex flex-col gap-3 flex-1">
                  <label htmlFor="firstName" className="">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                    placeholder="First Name"
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
                    className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                    placeholder="Last Name"
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
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                  placeholder="Password"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="confirmPassword" className="">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full p-2 rounded-sm hover:bg-gray-300 transition-colors focus:bg-gray-300 focus:outline-none"
                  placeholder="Confirm Password"
                />
              </div>

              <button
                type="submit"
                className="mt-4 bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign Up
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
