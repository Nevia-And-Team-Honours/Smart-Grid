import React from 'react';
import { Loader2 } from "lucide-react";

const Loading: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-gray-700" />
          <div className="absolute inset-0 h-10 w-10 animate-ping opacity-20 rounded-full bg-gray-400"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-gray-800">Processing Data</p>
          <p className="text-xs text-gray-500">Please wait while we analyze the grid parameters</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;