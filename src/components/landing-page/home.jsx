"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { UserPlus, Search, MessageSquare, GraduationCap, Shrub, Users, BanknoteX, Banknote, ArrowRightLeft, Calendar, Star, Clock, DollarSign, Lock, Layers, UserRoundPen } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [hoveredBeforeIndex, setHoveredBeforeIndex] = useState(null);
  const [hoveredAfterIndex, setHoveredAfterIndex] = useState(null);
  
  const featuresbefore = [
    {
      title: "lack of accessibility",
      icon: <Lock size={30} className="text-[#EF4444]" />
    },
    {
      title: "paid",
      icon: <Banknote size={30} className="text-[#EF4444]" />
    },
    {
      title: "limited availability",
      icon: <Clock size={30} className="text-[#EF4444]" />
    },
    {
      title: "resource inequality",
      icon: <Layers size={30} className="text-[#EF4444]" />
    },
    {
      title: "profit-driven motivation",
      icon: <DollarSign size={30} className="text-[#EF4444]" />
    },
  ];

  const featuresafter = [
    {
      title: "community driven",
      icon: <Users size={30} className="text-[#10B981]" />
    },
    {
      title: "learn & teach",
      icon: <GraduationCap size={30} className="text-[#10B981]" />
    },
    {
      title: "mutual growth",
      icon: <Shrub size={30} className="text-[#10B981]" />
    },
    {
      title: "completely free",
      icon: <BanknoteX size={30} className="text-[#10B981]" />
    },
    {
      title: "skill-based exchange",
      icon: <ArrowRightLeft size={30} className="text-[#10B981]" />
    },
  ]
  
  const howitworks = [
    {
      point: "Step 1: Sign Up",
      description: "Sign up for free and confirm your email. It's quick and easy!",
      icon: <UserPlus size={16} className="text-blue-600" />
    },
    {
      point: "Step 2: Create a Profile",
      description: "Fill in your details, set privacy preferences, and select one subject to teach and one to learn.",
      icon: <UserRoundPen size={16} className="text-blue-600" />
    },
    {
      point: "Step 3: Browse through your opposites",
      description: "View profiles of users with complementary skills. Send connection requests to whoever you like the best.",
      icon: <Search size={16} className="text-blue-600" />
    },
    {
      point: "Step 4: Wait for your match to accept your request",
      description: "Start a converstion through email to get to know each other better.",
      icon: <MessageSquare size={16} className="text-blue-600" />
    },
    {
      point: "Step 5: Schedule Sessions",
      description: "Set up regular meeting times that work for both of you to know each other and learn together.",
      icon: <Calendar size={16} className="text-blue-600" />
    },
  ]
  
  return (
    <main className="flex min-h-screen flex-col px-4 sm:px-8 lg:px-0 py-20">
      <div className="pb-20 lg:pb-30 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#1A1A2E] mb-4 text-center">LoopedIn</h1>
        <p className='text-center text-sm sm:text-lg mb-6'>We're called LoopedIn, cause its all about staying connected, sharing skills, and learning together.</p>
        
        <div className="relative w-full max-w-4xl rounded-md overflow-hidden shadow-2xl ">
          <Image
            src="/peer_connect.png"
            alt="LoopedIn Community"
            width={1200}
            height={600}
            className="w-full h-auto lg:w-full lg:h-auto object-cover"
            priority
          />
        </div>
      </div>

      <h1 className='text-xl sm:text-3xl xl:text-[40px] 2xl:text-5xl text-center font-bold text-[#1A1A2E] pb-8'>Where Do I Even Start? There’s No Space for Us.</h1>  
      <p className='text-left mx-auto max-w-[90%] text-xs sm:text-base mb-12'>  As a high schooler, I’ve always felt like there’s no real place for us to actually build, learn, and grow together. Everything out there is either too serious, too expensive, or just not made for people our age. That’s why I started LoopedIn</p>
      
      <div className="flex flex-wrap justify-center gap-4 px-4 md:px-8 lg:px-16 mb-10 md:mb-20 xl:mb-24">
        {featuresbefore.map((featurebefore, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              hoveredBeforeIndex !== null && index > hoveredBeforeIndex ? 'transform translate-x-10' : ''
            }`}
            onMouseEnter={() => setHoveredBeforeIndex(index)}
            onMouseLeave={() => setHoveredBeforeIndex(null)}
          >
            <Card
              className={`border-2 border-[#EF4444] text-[#334155] p-1 sm:p-2 xl:p-4 flex flex-row items-center justify-center transition-all duration-300 ${
                hoveredBeforeIndex === index ? 'scale-110 origin-left' : ''
              } group`}
            >
              <div className="transition-all duration-300 -mr-3">{featurebefore.icon}</div>
              <h3 className="text-sm sm:text-base xl:text-xl font-bold text-center  transition-all duration-300 whitespace-nowrap">
                {featurebefore.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className='text-xl  sm:text-3xl xl:text-[40px] 2xl:text-5xl text-center font-bold text-[#1A1A2E] pb-8'>Why LoopedIn?</h1>
      <p className='text-left mx-auto max-w-[90%] text-xs sm:text-base mb-12'>That’s why I started LoopedIn: it helps students match based on opposite strengths (V1), work on cool projects together (V2), and share notes or study smarter with AI (V3). Basically, it’s the platform I wish existed for people like us.</p>

      <div className="flex flex-wrap justify-center gap-4 px-4 md:px-8 lg:px-16 mb-20 md:mb-30 xl:mb-24">
        {featuresafter.map((featuresafter, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              hoveredAfterIndex !== null && index > hoveredAfterIndex ? 'transform translate-x-10' : ''
            }`}
            onMouseEnter={() => setHoveredAfterIndex(index)}
            onMouseLeave={() => setHoveredAfterIndex(null)}
          >
            <Card
              className={`border-2 border-[#10B981] text-[#334155] p-1 sm:p-2 xl:p-4 flex flex-row items-center justify-center transition-all duration-300 ${
                hoveredBeforeIndex === index ? 'scale-110 origin-left' : ''
              } group`}
            >
              <div className="transition-all duration-300 -mr-3">{featuresafter.icon}</div>
              <h3 className="text-sm sm:text-base xl:text-xl font-bold text-center  transition-all duration-300 whitespace-nowrap">
                {featuresafter.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-center text-[#1E3A8A] mb-8 sm:mb-12">
        How It Works
      </h1>

      <div className="container mx-auto px-4 md:px-8 lg:px-16">
        {howitworks.map((item, index) => (
          <div key={index} className="mb-16">
            <div className={`flex flex-col ${index % 2 === 0 ? 'xl:flex-row' : 'xl:flex-row-reverse'} items-center gap-8`}>
              
              <div className="w-full xl:w-1/2">
                <Card className="bg-white shadow-lg border-l-4 border-[#3B82F6] p-3 sm:p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center ">
                    <div className="bg-[#EFF6FF] p-2 sm:p-3 rounded-full mr-4">
                      {item.icon}
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-[#1E3A8A]">{item.point}</h3>
                  </div>
                  <p className="text-sm md:text-base xl:text-lg text-[#334155]">{item.description}</p>
                </Card>
              </div>
              
              <div className="w-full xl:w-1/2 flex items-center justify-center">
                <div className="relative w-full h-auto rounded-xl overflow-hidden shadow-lg border-2 border-[#CBD5E1]">
                  <Image
                    src={`/step${index + 1}.png`}
                    alt={`Step ${index + 1}: ${item.point}`}
                    width={800}
                    height={450}
                    className="w-full h-auto rounded-xl transition-transform duration-300 hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-20 w-full xl:w-2/3 mx-auto rounded-xl overflow-hidden shadow-2xl">
          <div className="relative w-full h-60">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A] to-transparent opacity-70">
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Join our Community</h3>
                <p className="text-base sm:text-lg">Help us make LoopedIn bigger and better. Find. Connect. Teach. Learn</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/signup" className="bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-bold py-3 px-10 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105">
            Get Started Today
          </Link>
        </div>
      </div>
    </main>
  )
}