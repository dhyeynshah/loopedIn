import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full border-b bg-white shadow-lg z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          skillexchangea
        </Link>
        <div className="bg-gray-800 rounded-full px-6 py-2">
          <div className="flex space-x-6">
            <Link href="/future-plans" className="text-white hover:text-gray-200">
              future plans
            </Link>
            <Link href="/contribute" className="text-white hover:text-gray-200">
              contribute?
            </Link>
          </div>
        </div>
        <Button variant="link" asChild>
          <Link href="/login">
            login
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;