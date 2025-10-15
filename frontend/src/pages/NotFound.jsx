import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSadTear } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="mb-6">
        <FaSadTear className="text-primary text-7xl md:text-8xl" />
      </div>

      {/* Text with fade-up animation */}
      <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fadeIn">
        404 - Page Not Found
      </h1>
      <p className="text-gray-600 mb-6 max-w-md animate-fadeIn delay-200">
        Oops! The page you're looking for doesn’t exist or may have been moved.
      </p>

      {/* Button */}
      <button
        onClick={() => navigate("/")}
        className="bg-primary text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeIn delay-300"
      >
        Go Back Home
      </button>
    </div>
  );
};

export default NotFound;
