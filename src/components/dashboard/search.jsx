"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, School, Check, X, AlertCircle, Heart, Zap, Clock, Star, Brain } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { findCompatiblePeers } from '@/lib/matching';
import UserDropdownNav from "./dropdown";

export default function EnhancedFindPeers() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [peers, setPeers] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("");
  const [processingConnection, setProcessingConnection] = useState(false);
  const [viewMode, setViewMode] = useState("ai"); 
  const [filter, setFilter] = useState({
    grade: "all",
    searchTerm: "",
  });

  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentTranslateXRef = useRef(0);

  const ensureAuthLoaded = async () => {
    if (!authUser) {
      const newUser = await refreshSession();
      if (!newUser) {
        return null;
      }
      return newUser;
    }
    return authUser;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const currentAuthUser = await ensureAuthLoaded();
        if (!currentAuthUser) {
          setError("Authentication required. Please sign in to find peers.");
          setLoading(false);
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from('tutoring_profile')
          .select('*')
          .eq('id', currentAuthUser.id)
          .single();
          
        if (profileError || !profileData) {
          console.error("Profile error:", profileError);
          setError("Could not load your profile data. Please complete your profile first.");
          setLoading(false);
          return;
        }
        
        setCurrentUser(profileData);
        
        const { data: peersData, error: peersError } = await supabase
          .from('tutoring_profile')
          .select('*')
          .eq('subject_proficient', profileData.subject_help)
          .eq('subject_help', profileData.subject_proficient)
          .neq('id', currentAuthUser.id);
        
        if (peersError) {
          console.error("Error fetching peers:", peersError);
          setError("Could not load peer data. Please try again.");
          setLoading(false);
          return;
        }
        
        const { data: existingConnections, error: connectionsError } = await supabase
          .from('connections')
          .select('receiver_id, sender_id')
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        const connectedIds = existingConnections?.reduce((acc, conn) => {
          if (conn.sender_id === currentAuthUser.id) {
            acc.push(conn.receiver_id);
          } else if (conn.receiver_id === currentAuthUser.id) {
            acc.push(conn.sender_id);
          }
          return acc;
        }, []) || [];
        
        const filteredPeers = peersData?.filter(peer => !connectedIds.includes(peer.id)) || [];
        setPeers(filteredPeers);
        
        if (filteredPeers.length > 0) {
          setAiLoading(true);
          try {
            const matches = await findCompatiblePeers(profileData, filteredPeers);
            setAiMatches(matches);
          } catch (error) {
            console.error("AI matching error:", error);
            toast.error("AI matching temporarily unavailable. Showing basic matches.");
            setAiMatches(filteredPeers.slice(0, 5));
          } finally {
            setAiLoading(false);
          }
        }
        
      } catch (error) {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchData();
    }
    
  }, [authUser, authLoading, supabase, router, searchParams]);

  const getInitials = (peer) => {
    const firstInitial = peer.first_name ? peer.first_name.charAt(0) : '?';
    const lastInitial = peer.display_status_lastname === 'on' && peer.last_name ? peer.last_name.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const createConnection = async (receiverId) => {
    if (!currentUser || !receiverId || processingConnection) return false;
    
    try {
      setProcessingConnection(true);
      
      const currentAuthUser = await ensureAuthLoaded();
      if (!currentAuthUser) {
        toast.error("Authentication error. Please sign in again.");
        return false;
      }
      
      const peer = (viewMode === "ai" ? aiMatches : peers).find(p => p.id === receiverId);
      if (!peer) {
        console.error("Peer not found in list", { receiverId });
        return false;
      }
      
      const subjectsShared = {
        sender_helps_with: currentUser.subject_proficient,
        sender_needs_help_with: currentUser.subject_help,
        receiver_helps_with: peer.subject_proficient,
        receiver_needs_help_with: peer.subject_help
      };
      
      const { data, error } = await supabase
        .from('connections')
        .insert({
          sender_id: currentAuthUser.id,
          receiver_id: receiverId,
          status: 'pending',
          subjects_shared: subjectsShared
        })
        .select();
        
      if (error) {
        console.error("Error creating connection:", error);
        
        if (error.code === '23505') { 
          toast.error(`You've already connected with ${peer.first_name}`);
          return true; 
        }
        
        toast.error("Unable to connect with this peer. Please try again.");
        return false;
      }
      
      toast.success(`You've sent a connection request to ${peer.first_name}`);
      return true;
    } catch (err) {
      console.error("Unexpected error creating connection:", err);
      toast.error("An unexpected error occurred. Please try again.");
      return false;
    } finally {
      setProcessingConnection(false);
    }
  };

  const handleConnect = async (connect) => {
    const currentList = viewMode === "ai" ? aiMatches : peers;
    if (currentIndex >= currentList.length) return;
    
    const peer = currentList[currentIndex];
    setDirection(connect ? "right" : "left");
    
    let success = true;
    if (connect) {
      success = await createConnection(peer.id);
    }
    
    if (success) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setDirection("");
      }, 300);
    } else {
      setTimeout(() => {
        setDirection("");
      }, 300);
    }
  };

  const handleTouchStart = (e) => {
    if (!cardRef.current) return;
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    startYRef.current = e.touches ? e.touches[0].clientY : e.clientY;
    isDraggingRef.current = true;
    currentTranslateXRef.current = 0;
    
    cardRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !cardRef.current) return;
    
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      isDraggingRef.current = false;
      cardRef.current.style.transform = `translateX(0px) rotate(0deg)`;
      return;
    }
    
    currentTranslateXRef.current = diffX;
    const rotate = diffX / 20; 
    cardRef.current.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;
    
    if (diffX > 50) {
      cardRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    } else if (diffX < -50) {
      cardRef.current.style.backgroundColor = "rgba(128, 128, 128, 0.05)";
    } else {
      cardRef.current.style.backgroundColor = "";
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || !cardRef.current) return;
    isDraggingRef.current = false;
    
    cardRef.current.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
    
    if (Math.abs(currentTranslateXRef.current) > 100) {
      if (currentTranslateXRef.current > 0) {
        handleConnect(true);
      } else {
        handleConnect(false);
      }
    } else {
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.backgroundColor = "";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading your perfect study matches...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Find Study Peers</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Authentication Required</h2>
          <p className="mb-6 text-gray-600">Please sign in to find peers</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/login'} className="bg-black hover:bg-gray-800 text-white">Sign In</Button>
            <Button variant="outline" onClick={() => router.push('/')} className="border-gray-300 text-gray-700 hover:bg-gray-100">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Find Study Peers</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Something went wrong</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} className="bg-black hover:bg-gray-800 text-white">Refresh Page</Button>
            <Button variant="outline" onClick={() => router.push('/')} className="border-gray-300 text-gray-700 hover:bg-gray-100">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentList = viewMode === "ai" ? aiMatches : peers;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">Find Study Peers</h1>
        
        <div className="flex items-center gap-4">
          <Button 
            variant={viewMode === "ai" ? "default" : "outline"}
            onClick={() => {setViewMode("ai"); setCurrentIndex(0);}}
            className={`flex items-center gap-2 ${viewMode === "ai" ? "bg-black text-white hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            disabled={aiLoading}
          >
            <Brain className="h-4 w-4" />
            {aiLoading ? "AI Analyzing..." : "AI Matches"}
          </Button>
          <Button 
            variant={viewMode === "browse" ? "default" : "outline"}
            onClick={() => {setViewMode("browse"); setCurrentIndex(0);}}
            className={`flex items-center gap-2 ${viewMode === "browse" ? "bg-black text-white hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            <Search className="h-4 w-4" />
            Browse All
          </Button>
          <UserDropdownNav />
        </div>
      </div>
      
      {!currentUser ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="mb-4">Unable to load your profile information</p>
          <Button onClick={() => router.push('/profile')} className="bg-black hover:bg-gray-800 text-white">Complete Your Profile</Button>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-gray-800 to-black p-4 rounded-lg mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">
                  {viewMode === "ai" ? "🤖 AI-powered matches based on personality & study style" : "📚 Browse all compatible peers"}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Looking for peers who can help with <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{currentUser.subject_help}</Badge> and
                  need help with <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{currentUser.subject_proficient}</Badge>
                </p>
              </div>
              {viewMode === "ai" && aiMatches.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold">{aiMatches.length}</div>
                  <div className="text-xs opacity-75">Smart Matches</div>
                </div>
              )}
            </div>
          </div>
          
          {currentList.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="mb-2">
                {viewMode === "ai" ? "No AI matches found" : "No matching peers found"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {viewMode === "ai" 
                  ? "Try completing more of your profile or check back later" 
                  : "Try adjusting your filters or check back later"
                }
              </p>
              {viewMode === "ai" && (
                <Button onClick={() => router.push('/profile')} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Complete Profile
                </Button>
              )}
            </div>
          ) : currentIndex >= currentList.length ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="mb-2">You've seen all {viewMode === "ai" ? "AI matches" : "potential peers"}</p>
              <p className="text-sm text-gray-500 mb-4">Check back later for new matches or try the other view mode</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCurrentIndex(0)} className="bg-black hover:bg-gray-800 text-white">Start Over</Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setViewMode(viewMode === "ai" ? "browse" : "ai");
                    setCurrentIndex(0);
                  }}
                >
                  Try {viewMode === "ai" ? "Browse All" : "AI Matches"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md mb-4">
                {[2, 1, 0].map(offset => {
                  const index = currentIndex + offset;
                  if (index >= currentList.length) return null;
                  
                  const peer = currentList[index];
                  const isTopCard = offset === 0;
                  
                  return (
                    <div 
                      key={peer.id}
                      ref={isTopCard ? cardRef : null}
                      className={`${isTopCard ? '' : 'absolute inset-0'} rounded-xl shadow-lg bg-white transition-all duration-300 ${
                        isTopCard ? 'z-30' : offset === 1 ? 'z-20 scale-95 -translate-y-2 opacity-70' : 'z-10 scale-90 -translate-y-4 opacity-40'
                      } ${
                        isTopCard && direction === 'right' ? 'translate-x-full rotate-12' : 
                        isTopCard && direction === 'left' ? '-translate-x-full -rotate-12' : ''
                      }`}
                      style={{
                        transform: `${isTopCard ? '' : 'scale(' + (1 - offset * 0.05) + ') translateY(-' + offset * 8 + 'px)'}`
                      }}
                      {...(isTopCard 
                        ? { 
                            onTouchStart: handleTouchStart, 
                            onTouchMove: handleTouchMove, 
                            onTouchEnd: handleTouchEnd,
                            onMouseDown: handleTouchStart,
                            onMouseMove: handleTouchMove,
                            onMouseUp: handleTouchEnd,
                            onMouseLeave: handleTouchEnd
                          } 
                        : {}
                      )}
                    >
                      <div className="flex flex-col h-full p-6">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-black text-white text-xl">
                              {getInitials(peer)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-black">
                              {peer.first_name}
                              {peer.display_status_lastname === 'on' ? ` ${peer.last_name}` : ''}
                            </h2>
                            <p className="text-gray-700 font-medium">{peer.grade}</p>
                            {viewMode === "ai" && peer.aiCompatibilityScore && (
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-600">
                                  {peer.aiCompatibilityScore}% Match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
                            Can help with {peer.subject_proficient}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100 border-gray-300 text-gray-700">
                            Needs help with {peer.subject_help}
                          </Badge>
                        </div>

                        {viewMode === "ai" && peer.explanation && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">AI Insight</span>
                            </div>
                            <p className="text-sm text-gray-700">{peer.explanation}</p>
                            {peer.funInsight && (
                              <p className="text-xs text-gray-600 mt-1 italic">💡 {peer.funInsight}</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-3 mb-4">
                          {peer.personality_type && (
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                <span className="font-medium">Personality:</span> {peer.personality_type}
                              </span>
                            </div>
                          )}
                          
                          {peer.study_style && (
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                <span className="font-medium">Learning Style:</span> {peer.study_style}
                              </span>
                            </div>
                          )}
                          
                          {peer.study_schedule && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                <span className="font-medium">Studies:</span> {peer.study_schedule}
                              </span>
                            </div>
                          )}

                          {peer.communication_style && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                <span className="font-medium">Communication:</span> {peer.communication_style}
                              </span>
                            </div>
                          )}
                        </div>

                        {(peer.favorite_food || peer.fun_fact) && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Fun Facts</h4>
                            {peer.favorite_food && (
                              <p className="text-xs text-gray-600 mb-1">
                                🍕 Favorite food: {peer.favorite_food}
                              </p>
                            )}
                            {peer.fun_fact && (
                              <p className="text-xs text-gray-600">
                                ✨ {peer.fun_fact}
                              </p>
                            )}
                          </div>
                        )}

                        {peer.bio && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-1 text-gray-800">About</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{peer.bio}</p>
                          </div>
                        )}
                        
                        <div className="mb-4 space-y-2">
                          {peer.display_status_school === 'on' && (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{peer.school}</span>
                            </div>
                          )}
                          {peer.display_status_email === 'on' && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{peer.email}</span>
                            </div>
                          )}
                        </div>

                        {viewMode === "ai" && peer.challenge && (
                          <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-xs text-gray-700">{peer.challenge}</span>
                            </div>
                          </div>
                        )}
                        
                        {isTopCard && (
                          <div className="text-center mt-auto pt-4 border-t">
                            <p className="text-xs text-gray-500">
                              Swipe right to connect, left to pass
                            </p>
                            {viewMode === "ai" && (
                              <p className="text-xs text-gray-500 mt-1">
                                🤖 AI-recommended match
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-8 w-full max-w-md mt-6">
                <Button 
                  className="h-16 w-16 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 border-2 border-gray-200"
                  variant="outline"
                  onClick={() => handleConnect(false)}
                  disabled={processingConnection}
                >
                  <X className="h-8 w-8" />
                </Button>
                <Button 
                  className="h-16 w-16 rounded-full bg-black hover:bg-gray-800 text-white border-2 border-black" 
                  onClick={() => handleConnect(true)}
                  disabled={processingConnection}
                >
                  <Check className="h-8 w-8" />
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  {currentIndex + 1} of {currentList.length} {viewMode === "ai" ? "AI matches" : "peers"}
                </p>
                <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / currentList.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}