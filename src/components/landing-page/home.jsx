"use client";
import React, { useState } from 'react';
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, Search, MessageSquare, GraduationCap, Shrub, Users, BanknoteX, ArrowRightLeft, Calendar, Star, Clock } from 'lucide-react'

dwAexport default function Home() {
  const [hoveredBeforeIndex, setHoveredBeforeIndex] = useState(null);
  const [hoveredAfterIndex, setHoveredAfterIndex] = useState(null);
  
  const featuresbefore = [
    {
      title: "community driven",
      icon: <Users size={25} className="text-blue-600" />
    },
    {
      title: "learn & teach",
      icon: <GraduationCap size={25} className="text-blue-600" />
    },
    {
      title: "mutual growth",
      icon: <Shrub size={25} className="text-blue-600" />
    },
    {
      title: "completely free",
      icon: <BanknoteX size={25} className="text-blue-600" />
    },
    {
      title: "skill-based exchange",
      icon: <ArrowRightLeft size={25} className="text-blue-600" />
    },
  ]

  const featuresafter = [
    {
      title: "community driven",
      icon: <Users size={25} className="text-blue-600" />
    },
    {
      title: "learn & teach",
      icon: <GraduationCap size={25} className="text-blue-600" />
    },
    {
      title: "mutual growth",
      icon: <Shrub size={25} className="text-blue-600" />
    },
    {
      title: "completely free",
      icon: <BanknoteX size={25} className="text-blue-600" />
    },
    {
      title: "skill-based exchange",
      icon: <ArrowRightLeft size={25} className="text-blue-600" />
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
      <div className="relative w-full mb-8">
        <div className="w-full h-auto">
          <Image
            src="/banner.png"
            alt="Program hero image"
            width={1920}
            height={1080}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
      
      <h1 className='text-3xl md:text-5xl text-center font-bold text-[#1A1A2E] mb-10 pl-8'>How users typically learn</h1>  
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 px-4 md:px-8 lg:px-48 mb-12">
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
            className={`bg-[#505673] text-[#ECEEFF] p-2 flex flex-row items-center justify-center transition-all duration-300 ${
              hoveredBeforeIndex === index ? 'scale-120 origin-left' : ''
            } group`}
           >
              <div className="group-hover:mr-2 transition-all duration-300">{featurebefore.icon}</div>
              <h3 className="text-lg font-bold text-center group-hover:translate-x-2 transition-all duration-300">
              {featurebefore.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className='text-3xl md:text-5xl text-center font-bold text-[#1A1A2E] mb-10 pl-8'>How will users learn</h1>  
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 px-4 md:px-8 lg:px-48 mb-12">
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
            className={`bg-[#505673] text-[#ECEEFF] p-2 flex flex-row items-center justify-center transition-all duration-300 ${
              hoveredAfterIndex === index ? 'scale-120 origin-left' : ''
            } group`}
           >
              <div className="group-hover:mr-2 transition-all duration-300">{featuresafter.icon}</div>
              <h3 className="text-lg font-bold text-center group-hover:translate-x-2 transition-all duration-300">
              {featuresafter.title}
              </h3>
            </Card>
          </div>
        ))}
      </div>

      <h1 className="text-3xl md:text-5xl font-semibold text-[#1A1A2E] mb-6 pl-8">
        How it works?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8 lg:px-8 mb-12">
        {howitworks.map((item, index) => (
          <Card key={index} className="bg-[#707698] shadow-md rounded-lg p-6 flex flex-col">
            <div className="flex items-center -mb-3">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <div className='w-4 h-4'>{item.icon}</div>
              </div>
              <h3 className="text-lg font-semibold text-[#2C2E43]">{item.point}</h3>
            </div>
            <p className="text-sm text-[#16213E] mt-0">{item.description}</p>
          </Card>
        ))}
      </div>
    </main>
  )
}