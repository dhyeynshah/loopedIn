import React from 'react';
import Link from 'next/link';
import { Users, UserCircle, Network } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#707698] text-white h-screen pt-16 pb-16 sticky top-0">
      <div className="p-6 flex flex-col h-full overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold">skillexchange</h2>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link href="/find-peers" className="flex items-center p-3 rounded-lg hover:bg-[#3a6a71] transition-colors">
                <Users size={20} className="mr-3" />
                <span className="font-medium">Find Peers</span>
              </Link>
            </li>
            
            <li>
              <Link href="/profile" className="flex items-center p-3 rounded-lg hover:bg-[#3a6a71] transition-colors">
                <UserCircle size={20} className="mr-3" />
                <span className="font-medium">Profile</span>
              </Link>
            </li>
            
            <li>
              <Link href="/connections" className="flex items-center p-3 rounded-lg hover:bg-[#3a6a71] transition-colors">
                <Network size={20} className="mr-3" />
                <span className="font-medium">Connections</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;