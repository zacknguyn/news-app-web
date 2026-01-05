import { useNavigate } from "react-router-dom";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your login logic here
    console.log("Login submitted");
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="text-center m-20">
      <h1 className="font-bold">Welcome back!</h1>
      <h2 className="text-gray-500">Please log in to continue</h2>

      <div className="p-1 w-96 mx-auto mt-20">
        <form onSubmit={handleSubmit}>
          <div className="m-4 text-left flex flex-col gap-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <input
                className="w-full p-2 pl-10 border bg-gray-200 rounded-[10px]"
                type="email"
                id="Email"
                name="Email"
                placeholder="Email"
                required
              />
            </div>

            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                className="w-full p-2 pl-10 border bg-gray-200 rounded-[10px]"
                type="password"
                id="Password"
                name="Password"
                placeholder="Password"
                required
              />
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-[10px] transition-colors"
              type="submit"
            >
              Log In
            </button>
          </div>
        </form>
      </div>

      <div className="mt-2 flex items-center w-96 mx-auto">
        <div className="grow border-t border-gray-500" />
        <span className="px-4 text-gray-500">Or</span>
        <div className="grow border-t border-gray-500" />
      </div>

      <button
        className="mt-4 w-96 mx-auto bg-green-600 hover:bg-green-700 text-white p-2 rounded-[10px] transition-colors"
        onClick={handleRegisterClick}
      >
        Register
      </button>
    </div>
  );
};

export default LoginScreen;
