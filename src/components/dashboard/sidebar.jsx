import React from 'react';
import Link from 'next/link';
import { Users, UserCircle, Network } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#F8FAFC] border-2 rounded-md border-[#CBD5E1] text-white h-screen pt-16 pb-16 sticky top-0">
      <div className="p-6 flex flex-col h-full overflow-y-auto">
        
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link href="/find-peers" className="flex items-center p-3 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                <Users size={20} className="mr-3 text-[#1E3A8A]" />
                <span className="font-medium text-[#334155]">Find Peers</span>
              </Link>
            </li>
            
            <li>
              <Link href="/profile" className="flex items-center p-3 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                <UserCircle size={20} className="mr-3 text-[#1E3A8A]"/>
                <span className="font-medium text-[#334155]">Profile</span>
              </Link>
            </li>
            
            <li>
              <Link href="/connections" className="flex items-center p-3 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                <Network size={20} className="mr-3 text-[#1E3A8A]" />
                <span className="font-medium text-[#334155]">Connections</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;