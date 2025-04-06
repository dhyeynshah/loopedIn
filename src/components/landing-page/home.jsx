"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { UserPlus, Search, MessageSquare, GraduationCap, Shrub, Users, BanknoteX, Banknote, ArrowRightLeft, Calendar, Star, Clock, DollarSign, Lock, Layers } from 'lucide-react';
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
      point: "Step 1: Create a Profile",
      description: "Fill in your details, set privacy preferences, and select one subject to teach and one to learn.",
      icon: <UserPlus size={16} className="text-blue-600" />
    },
    {
      point: "Step 2: Browse through your opposites",
      description: "View profiles of users with complementary skills. Send connection requests to potential matches.",
      icon: <Search size={16} className="text-blue-600" />
    },
    {
      point: "Step 3: Connect with Your Match",
      description: "Start a conversation and plan your learning sessions once connected.",
      icon: <MessageSquare size={16} className="text-blue-600" />
    },
    {
      point: "Step 4: Schedule Sessions",
      description: "Set up regular meeting times that work for both of you to exchange knowledge.",
      icon: <Calendar size={16} className="text-blue-600" />
    },
    {
      point: "Step 5: Track Your Progress",
      description: "Monitor your learning journey and celebrate milestones as you develop new skills.",
      icon: <Star size={16} className="text-blue-600" />
    },
    {
      point: "Step 6: Expand Your Network",
      description: "Connect with additional users to learn multiple skills or deepen your expertise.",
      icon: <Clock size={16} className="text-blue-600" />
    },
  ]
  
  return (
    <main className="flex min-h-screen flex-col">
      <div className="pt-24 pb-12 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#1A1A2E] mb-4 text-center">LoopedIn</h1>
        <p className='text-center text-lg mb-6'>We're called LoopedIn, cause its all about staying connected, sharing skills, and learning together.</p>
        
        {/* Added rounded image */}
        <div className="relative w-200 h-95 mb-25 rounded-md overflow-hidden shadow-2xl">
          <Image 
            src="/peer_connect.png" 
            alt="LoopedIn Community" 
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <h1 className='text-3xl md:text-5xl text-center font-bold text-[#1A1A2E] pb-8 pl-8'>The Flaw in Peer Tutoring: Why Students Struggle to Find Help</h1>  
      <p className='text-left mx-auto max-w-[90%] text-lg mb-12'>  Traditional peer tutoring often comes with a catch—high fees and limited access. Many tutoring services charge you an insane amount for lessons with peers who are just as young as you. Studies show that affordability and access are two of the biggest barriers for students seeking help. That's where LoopedIn steps in. We're all about breaking down those barriers, staying connected, and creating a platform where sharing skills and learning together is seamless and completely free.</p>
      
      <div className="flex flex-wrap justify-center gap-4 px-4 md:px-8 lg:px-16 mb-30">
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
              className={`border-2 border-[#EF4444] text-[#334155] p-4 flex flex-row items-center justify-center transition-all duration-300 ${
                hoveredBeforeIndex === index ? 'scale-110 origin-left' : ''
              } group`}
            >
              <div className="transition-all duration-300 -mr-3">{featurebefore.icon}</div>
              <h3 className="text-xl font-bold text-center  transition-all duration-300 whitespace-nowrap">
                {featurebefore.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className='text-3xl md:text-5xl text-center font-bold text-[#1A1A2E] pb-8 pl-8'>Why LoopedIn is the Future of Peer Tutoring</h1>
      <p className='text-left mx-auto max-w-[90%] text-lg mb-12'>At LoopedIn, we’re revolutionizing the way students share knowledge. With us, you get access to a community-driven platform where learning is 100% free, flexible, and skill-based. Whether you’re looking to teach or learn, LoopedIn connects you with peers who share your passions, helping you grow together without the burden of expensive lessons. Say goodbye to barriers, and hello to limitless learning opportunities!</p>

      <div className="flex flex-wrap justify-center gap-4 px-4 md:px-8 lg:px-16 mb-12">
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
              className={`border-2 border-[#10B981] p-4 flex flex-row items-center justify-center transition-all duration-300 mb-20 ${
                hoveredAfterIndex === index ? 'scale-110 origin-left' : ''
              } group`}
            >
              <div className="transition-all duration-300 -mr-3">{featuresafter.icon}</div>
              <h3 className="text-xl font-bold text-center transition-all duration-300 ml-2 whitespace-nowrap">
                {featuresafter.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className="text-3xl md:text-5xl font-bold text-center text-[#1E3A8A] mb-12">
        How It Works
      </h1>

      <div className="container mx-auto px-4 md:px-8 lg:px-16 mb-24">
        {howitworks.map((item, index) => (
          <div key={index} className="mb-16">
            <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8`}>
              
              <div className="w-full lg:w-1/2">
                <Card className="bg-white shadow-lg border-l-4 border-[#3B82F6] p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="bg-[#EFF6FF] p-3 rounded-full mr-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-[#1E3A8A]">{item.point}</h3>
                  </div>
                  <p className="text-[#334155] mt-2">{item.description}</p>
                  
                  <div className="mt-4 inline-flex items-center justify-center bg-[#1E3A8A] text-white w-8 h-8 rounded-full">
                    <span className="font-bold text-sm">{index + 1}</span>
                  </div>
                </Card>
              </div>
              
              <div className="w-full lg:w-1/2 h-70">
                <div className="relative w-full h-70 rounded-xl overflow-hidden shadow-lg border-2 border-[#CBD5E1]">
                  <Image 
                    src={`/step${index + 1}.png`} 
                    alt={`Step ${index + 1}: ${item.point}`}
                    fill
                    className="object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-20 w-full md:w-3/4 lg:w-2/3 mx-auto rounded-xl overflow-hidden shadow-2xl">
          <div className="relative w-full h-80">
            <Image 
              src="/collaboration.jpg" 
              alt="Students collaborating"
              fill
              className="object-cover rounded-xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A] to-transparent opacity-70">
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Join the Community</h3>
                <p className="text-lg">Thousands of students are already learning and teaching on LoopedIn</p>
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