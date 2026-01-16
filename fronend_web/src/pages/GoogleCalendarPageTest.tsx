import React from 'react';
import { Calendar } from 'lucide-react';

const GoogleCalendarPageTest: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="text-center">
        <Calendar size={64} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold dark:text-white mb-4">
          Google Calendar Test Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          If you can see this, the page is loading correctly!
        </p>
        <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <p className="text-green-800 dark:text-green-300">
            ✅ Page loaded successfully!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarPageTest;
