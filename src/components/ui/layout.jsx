import React from 'react';
import UnifiedSidebar from '../dashboard/dropdown';

const Layout = ({ children }) => {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="flex">
        <UnifiedSidebar />
        {/* Main Content Area */}
        <main className="flex-1 lg:ml-80 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;