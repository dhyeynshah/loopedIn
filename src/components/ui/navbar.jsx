"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 

const Navbar = () => {
  const { user } = useAuth();
  const router = useRouter(); 
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md py-2 px-2 sm:px-4 md:px-6 z-50 h-16 flex items-center border-b">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center">
          <div className="h-12 sm:h-14 flex items-center justify-center overflow-visible">
            <Image
              src="/loopedin_logo.png"
              alt="LoopedIn Logo"
              width={60}
              height={60}
              className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 text-xs sm:text-sm md:text-base ml-8 sm:ml-12 lg:ml-16">
          <Link href="/" className="text-[#60A5FA] font-medium hover:text-[#7DD3FC] transition-colors">
            Home
          </Link>
          <Link href="/future-plans" className="text-[#60A5FA] font-medium hover:text-[#7DD3FC] transition-colors">
            Future&nbsp;Plans
          </Link>
          <Link href="/contribute" className="text-[#60A5FA] font-medium hover:text-[#7DD3FC] transition-colors">
            Contribute
          </Link>
          
          {user ? (
            <Button variant="outline" className="ml-4 text-[#1E3A8A]" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="ml-4 text-[#1E3A8A]">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;