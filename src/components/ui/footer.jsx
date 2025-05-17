import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="w-full border-t bg-[#0F2A6F] shadow-lg mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Image
              src="/loopedin_logo.png"
              alt="SkillExchange Logo"
              width={60}
              height={60}
            />
          </Link>
          
          <div className="flex flex-wrap justify-center gap-4 lg:gap-18 text-[#60A5FA] text-sm md:text-base">
            <Link href="/home" className="hover:text-[#7DD3FC] transition-colors">
              Home
            </Link>
            <Link href="/future-plans" className="hover:text-[#7DD3FC] transition-colors">
              Future Plans
            </Link>
            <Link href="/contribute" className="hover:text-[#7DD3FC] transition-colors">
              Contribute
            </Link>
            <Link href="/terms" className="hover:text-[#7DD3FC] transition-colors">
              Terms & Conditions
            </Link>
          </div>
          
          <a href="mailto:ds.loopedin@gmail.com" className="text-sm md:text-base text-[#60A5FA] hover:text-[#7DD3FC] transition-colors">
            ds.loopedin@gmail.com
          </a>
        </div>
        
        <div className="mt-2 text-center text-[#A3BFFA] text-sm md:text-base ">
          © {new Date().getFullYear()} LoopedIn. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;