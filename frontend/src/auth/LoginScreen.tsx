const LoginScreen: React.FC = () => {
  return (
    <div className="flex flex-row h-screen gap-2">
      <div className="m-5 rounded-3xl w-1/2 bg-blue-500 flex items-center justify-center overflow-hidden">
        <img
          src="../../public/image1.jpg"
          alt="Logo"
          className="object-scale-down"
        />
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <form className="flex flex-col gap-4 w-3/4">
          <h2 className="text-2xl mb-4">Login to Your Account</h2>
          <input
            type="email"
            placeholder="Email"
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
