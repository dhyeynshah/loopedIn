"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  const fullText = "LinkedIn sucks. Reddit sucks. Peer tutoring is expensive. I build something just for us, high schoolers. That is LoopedIn. Connect. Learn Together.";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fullText]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-[#1A1A2E] mb-8 tracking-tight">
          LoopedIn
        </h1>
        
        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 leading-relaxed font-medium mb-12">
          {displayedText}
          <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>|</span>
        </div>

        {user ? (
          <Link href="/find-peers" className="group inline-flex items-center gap-3 bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:px-12 text-lg">
            Go to Dashboard
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ) : (
          <Link href="/signup" className="group inline-flex items-center gap-3 bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:px-12 text-lg">
            Know More
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </main>
  );
}