import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-pink-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
