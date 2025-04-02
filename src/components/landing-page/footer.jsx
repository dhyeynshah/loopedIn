import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <nav className="sticky bottom-0 left-0 right-0 w-full border-t bg-[#468189] shadow-lg z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          skillexchange
        </Link>
        <div className='flex gap-4 font-bold text-white'>
          <Link href="/home" className="hover:text-gray-200">
            home /
          </Link>
          <Link href="/future-plans" className="hover:text-gray-200">
            future plans /
          </Link>
          <Link href="/contribute" className="hover:text-gray-200">
            contribute? /
          </Link>
          <Link href="/terms" className="hover:text-gray-200">
            terms & conditions
          </Link>
        </div>
        <a href="mailto:skillexchange@gmail.com" className="text-white font-bold hover:text-gray-200">
          skillexchange@gmail.com
        </a>
        <p className="text-white font-bold mt-2">
          © {new Date().getFullYear()} skillexchange. All rights reserved.
        </p>
      </div>
    </nav>
  );
};

export default Footer;