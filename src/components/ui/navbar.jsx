import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full border-b bg-[#F8F9FF] shadow-lg z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <p className="text-2xl font-bold text-[#4E54C8]">
          skillexchange
        </p>
        <div className="bg-[#16213E] rounded-full px-6 py-2">
          <div className="flex space-x-6">
            <Link href="/home" className="text-[#F8F9FF] font-medium hover:text-[#4E54C8]">
              home
            </Link>
            <Link href="/future-plans" className="text-[#F8F9FF] font-medium hover:text-[#4E54C8]">
              future plans
            </Link>
            <Link href="/contribute" className="text-[#F8F9FF] font-medium hover:text-[#4E54C8]">
              contribute?
            </Link>
          </div>
        </div>
        <Button variant="link" className="font-bold text-xl" asChild>
          <Link href="/login">
            login
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;