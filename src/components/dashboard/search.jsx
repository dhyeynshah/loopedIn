// Authentication system, debugging functions, and base component structure especially the swipe function were written with the help of ChatGPT.

"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, School, Check, X, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // Update this path to match your project structure

export default function FindPeers() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [peers, setPeers] = useState([]);
  const [filteredPeers, setFilteredPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("");
  const [processingConnection, setProcessingConnection] = useState(false);
  const [filter, setFilter] = useState({
    grade: "all",
    searchTerm: "",
  });

  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentTranslateXRef = useRef(0);

  // Function to ensure we have the latest auth state
  const ensureAuthLoaded = async () => {
    if (!authUser) {
      console.log("Auth user not found in FindPeers, attempting to refresh session");
      const newUser = await refreshSession();
      if (!newUser) {
        console.log("Still no auth user after refresh in FindPeers");
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
        
        // Get the authenticated user using our new function
        const currentAuthUser = await ensureAuthLoaded();
        if (!currentAuthUser) {
          setError("Authentication required. Please sign in to find peers.");
          setLoading(false);
          return;
        }
        
        // Log the authenticated user to confirm
        console.log("FINDPEERS - CONFIRMED AUTH USER:", {
          id: currentAuthUser.id,
          email: currentAuthUser.email
        });
        
        // Fetch profile data for the authenticated user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentAuthUser.id)
          .single();
          
        if (profileError || !profileData) {
          console.error("Profile error:", profileError);
          setError("Could not load your profile data. Please try again.");
          setLoading(false);
          return;
        }
        
        console.log("Current user profile loaded:", profileData);
        setCurrentUser(profileData);
        
        // Fetch peers where the matching criteria is met AND not the current user
        const { data: peersData, error: peersError } = await supabase
          .from('profiles')
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
        
        console.log("Raw peers data:", peersData);
        
        // Fetch existing connections to filter out already connected peers
        const { data: existingConnections, error: connectionsError } = await supabase
          .from('connections')
          .select('receiver_id, sender_id')
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        if (connectionsError) {
          console.error("Error fetching connections:", connectionsError);
        }
        
        // We need to filter out peers that are already connected to the current user
        // either as sender or receiver
        const connectedIds = existingConnections?.reduce((acc, conn) => {
          if (conn.sender_id === currentAuthUser.id) {
            acc.push(conn.receiver_id);
          } else if (conn.receiver_id === currentAuthUser.id) {
            acc.push(conn.sender_id);
          }
          return acc;
        }, []) || [];
        
        console.log("Connected IDs to filter out:", connectedIds);
        
        const filteredPeers = peersData?.filter(peer => !connectedIds.includes(peer.id)) || [];
        
        console.log(`Found ${filteredPeers.length} potential peers (${connectedIds.length} filtered out)`);
        setPeers(filteredPeers);
        setFilteredPeers(filteredPeers);
      } catch (error) {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch data if auth is ready
    if (!authLoading) {
      fetchData();
    }
    
  }, [authUser, authLoading, supabase, router]);

  useEffect(() => {
    if (!peers.length) return;
    
    let result = [...peers];
    
    if (filter.grade && filter.grade !== "all") {
      result = result.filter(peer => peer.grade === filter.grade);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      result = result.filter(peer => 
        peer.first_name.toLowerCase().includes(term) || 
        (peer.display_status_lastname === 'on' && peer.last_name?.toLowerCase().includes(term)) ||
        peer.subject_proficient.toLowerCase().includes(term) ||
        peer.subject_help.toLowerCase().includes(term) ||
        (peer.display_status_school === 'on' && peer.school?.toLowerCase().includes(term))
      );
    }
    
    setFilteredPeers(result);
    setCurrentIndex(0);
  }, [filter, peers]);

  const getInitials = (peer) => {
    const firstInitial = peer.first_name ? peer.first_name.charAt(0) : '?';
    const lastInitial = peer.display_status_lastname === 'on' && peer.last_name ? peer.last_name.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const handleGradeChange = (value) => {
    setFilter(prev => ({ ...prev, grade: value }));
  };
  
  const handleSearchChange = (e) => {
    setFilter(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const createConnection = async (receiverId) => {
    if (!currentUser || !receiverId || processingConnection) return false;
    
    try {
      setProcessingConnection(true);
      
      // Ensure we have the authenticated user again
      const currentAuthUser = await ensureAuthLoaded();
      if (!currentAuthUser) {
        toast.error("Authentication error. Please sign in again.");
        return false;
      }
      
      const peer = filteredPeers.find(p => p.id === receiverId);
      if (!peer) {
        console.error("Peer not found in filtered peers list", { receiverId });
        return false;
      }
      
      // VERY IMPORTANT DEBUGGING LOGS
      console.log("CREATE CONNECTION DEBUG INFO:", {
        current_user: {
          id: currentAuthUser.id,
          email: currentAuthUser.email,
          first_name: currentUser.first_name
        },
        peer: {
          id: peer.id,
          email: peer.email,
          first_name: peer.first_name
        },
        sender_will_be: currentAuthUser.id,
        receiver_will_be: receiverId
      });
      
      const subjectsShared = {
        sender_helps_with: currentUser.subject_proficient,
        sender_needs_help_with: currentUser.subject_help,
        receiver_helps_with: peer.subject_proficient,
        receiver_needs_help_with: peer.subject_help
      };
      
      console.log("About to insert connection with sender_id:", currentAuthUser.id, "receiver_id:", receiverId);
      
      // Use currentAuthUser.id to ensure the correct sender ID
      const { data, error } = await supabase
        .from('connections')
        .insert({
          sender_id: currentAuthUser.id,  // YOU are the sender
          receiver_id: receiverId,        // The PEER is the receiver
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
      
      console.log("Connection created successfully:", data);
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
    if (currentIndex >= filteredPeers.length) return;
    
    const peer = filteredPeers[currentIndex];
    setDirection(connect ? "right" : "left");
    
    let success = true;
    if (connect) {
      console.log(`Connecting with ${peer.first_name}`);
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
      cardRef.current.style.backgroundColor = "rgba(0, 255, 0, 0.05)";
    } else if (diffX < -50) {
      cardRef.current.style.backgroundColor = "rgba(255, 0, 0, 0.05)";
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading peer matches...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Find Study Peers</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Authentication Required</h2>
          <p className="mb-6 text-slate-700">Please sign in to find peers</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Find Study Peers</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="mb-6 text-slate-700">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#1E3A8A]">Find Study Peers</h1>
      
      {!currentUser ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg">
          <p className="mb-4">Unable to load your profile information</p>
          <Button onClick={() => router.push('/profile')}>Go to Profile</Button>
        </div>
      ) : (
        <>
          <div className="bg-[#CBD5E1] p-4 rounded-lg mb-6">
            <p className="text-sm text-[#334155]">
              Showing peers who can help with <Badge variant="secondary" className="bg-[#60A5FA] text-[#EFF6FF]">{currentUser.subject_help}</Badge> and
              need help with <Badge variant="secondary" className="bg-[#60A5FA] text-[#EFF6FF]">{currentUser.subject_proficient}</Badge>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or school"
                  value={filter.searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filter.grade} onValueChange={handleGradeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredPeers.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
              <p className="mb-2">No matching peers found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters or check back later</p>
            </div>
          ) : currentIndex >= filteredPeers.length ? (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
              <p className="mb-2">You've seen all potential peers</p>
              <p className="text-sm text-slate-500 mb-4">Check back later for new matches</p>
              <Button onClick={() => setCurrentIndex(0)}>Start Over</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md mb-4">
                {[2, 1, 0].map(offset => {
                  const index = currentIndex + offset;
                  if (index >= filteredPeers.length) return null;
                  
                  const peer = filteredPeers[index];
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
                            <AvatarFallback className="bg-[#1E3A8A] text-[#EFF6FF] text-xl">
                              {getInitials(peer)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="text-xl font-bold text-[#1E3A8A]">
                              {peer.first_name}
                              {peer.display_status_lastname === 'on' ? ` ${peer.last_name}` : ''}
                            </h2>
                            <p className="text-[#1D4ED8] font-medium"> {peer.grade}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="bg-green-50">Can help with {peer.subject_proficient}</Badge>
                          <Badge variant="outline" className="bg-blue-50">Needs help with {peer.subject_help}</Badge>
                        </div>
                        
                        {peer.bio && (
                          <div className="mb-4">
                            <h3 className="font-medium mb-1">Bio</h3>
                            <p className="text-[#334155] text-sm">{peer.bio}</p>
                          </div>
                        )}
                        
                        <div className="mb-4 space-y-2">
                          {peer.display_status_school === 'on' && (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{peer.school}</span>
                            </div>
                          )}
                          {peer.display_status_email === 'on' && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{peer.email}</span>
                            </div>
                          )}
                        </div>
                        
                        {isTopCard && (
                          <div className="text-center mt-auto pt-4 border-t">
                            <p className="text-xs text-slate-500">Swipe right to connect, left to pass</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="fixed-position flex justify-center gap-8 w-full max-w-md mt-6">
                <Button 
                  className="h-16 w-16 rounded-full bg-red-50 hover:bg-red-100 text-red-500"
                  variant="outline"
                  onClick={() => handleConnect(false)}
                  disabled={processingConnection}
                >
                  <X className="h-8 w-8" />
                </Button>
                <Button 
                  className="h-16 w-16 rounded-full bg-green-50 hover:bg-green-100 text-green-500" 
                  variant="outline"
                  onClick={() => handleConnect(true)}
                  disabled={processingConnection}
                >
                  <Check className="h-8 w-8" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}