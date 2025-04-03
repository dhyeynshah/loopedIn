import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <nav className="w-full border-t bg-[#16213E] shadow-lg mt-auto">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          skillexchange
        </Link>
        <div className='flex gap-4 font-bold text-[#9FA5D5]'>
          <Link href="/home" className="hover:text-[#ECEEFF]">
            home /
          </Link>
          <Link href="/future-plans" className="hover:text-[#ECEEFF]">
            future plans /
          </Link>
          <Link href="/contribute" className="hover:text-[#ECEEFF]">
            contribute? /
          </Link>
          <Link href="/terms" className="hover:text-[#ECEEFF]">
            terms & conditions
          </Link>
        </div>
        <a href="mailto:skillexchange@gmail.com" className="text-[#B0B5D9] font-bold hover:text-[#ECEEFF]">
          skillexchange@gmail.com
        </a>
        <p className="text-[#B0B5D9] font-bold mt-2">
          © {new Date().getFullYear()} skillexchange. All rights reserved.
        </p>
      </div>
    </nav>
  );
};

export default Footer;