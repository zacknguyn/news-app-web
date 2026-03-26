import React from "react";
import { useAuth } from "../context/AuthContext";

const HomeScreen: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="min-h-auto border border-border m-2">
      <h1 className="text-right">Hello World</h1>
    </section>
  );
};

export default HomeScreen;
