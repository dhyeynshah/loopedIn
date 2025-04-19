"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, CheckCircle, Clock, X, Check, Send, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // Update this path to match your project structure

export default function Connections() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const [sentConnections, setSentConnections] = useState([]);
  const [receivedConnections, setReceivedConnections] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
  const supabase = createClientComponentClient();

  // Function to ensure we have the latest auth state
  const ensureAuthLoaded = async () => {
    if (!authUser) {
      console.log("Auth user not found in Connections, attempting to refresh session");
      const newUser = await refreshSession();
      if (!newUser) {
        console.log("Still no auth user after refresh in Connections");
        toast.error("Authentication error. Please sign in again.");
        return null;
      }
      return newUser;
    }
    return authUser;
  };
  
  const fetchUserAndConnections = async () => {
    try {
      setLoading(true);
      
      // Get the authenticated user using our new function
      const currentAuthUser = await ensureAuthLoaded();
      if (!currentAuthUser) {
        setLoading(false);
        return;
      }
      
      // Log the authenticated user to confirm
      console.log("CONNECTIONS - CONFIRMED AUTH USER:", {
        id: currentAuthUser.id,
        email: currentAuthUser.email
      });
      
      // Set the userId from our authenticated user
      setUserId(currentAuthUser.id);
      
      // Log all connections in the database to debug
      const { data: allConnections, error: allConnError } = await supabase
        .from('connections')
        .select('*');
        
      if (allConnError) {
        console.error('Error fetching all connections:', allConnError);
      } else {
        console.log("All connections in database:", allConnections);
      }
      
      // Fetch ALL connections where the current user is either sender or receiver
      // Use simpler query syntax
      const { data: connections, error: connError } = await supabase
        .from('connections')
        .select(`
          *,
          sender:profiles!connections_sender_id_fkey(*),
          receiver:profiles!connections_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
        
      if (connError) {
        console.error('Error fetching connections:', connError);
        toast.error(`Error loading connections: ${connError.message}`);
        setLoading(false);
        return;
      }
      
      // If no connections found at all, try alternative formats for the constraints
      if (!connections || connections.length === 0) {
        console.log("No connections found with main query, trying alternative query formats...");
        
        // Try alternative format 1
        const { data: connections1, error: connError1 } = await supabase
          .from('connections')
          .select(`
            *,
            sender:profiles(*),
            receiver:profiles(*)
          `)
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        if (!connError1 && connections1 && connections1.length > 0) {
          console.log("Found connections with alternative format 1:", connections1);
          processConnections(connections1, currentAuthUser.id);
          setLoading(false);
          return;
        }
        
        // Try alternative format 2 - direct query without joins
        const { data: connections2, error: connError2 } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        if (!connError2 && connections2 && connections2.length > 0) {
          console.log("Found connections with simple query:", connections2);
          
          // Now fetch profiles separately
          for (const conn of connections2) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conn.sender_id)
              .single();
              
            // Fetch receiver profile
            const { data: receiverProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conn.receiver_id)
              .single();
              
            // Add profiles to connection
            conn.sender = senderProfile;
            conn.receiver = receiverProfile;
          }
          
          processConnections(connections2, currentAuthUser.id);
          setLoading(false);
          return;
        }
      }
      
      console.log("Raw connections data:", connections);
      
      // Process connections
      processConnections(connections, currentAuthUser.id);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Error loading connections: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to process connections
  const processConnections = (connections, currentUserId) => {
    if (!connections || connections.length === 0) {
      console.log("No connections to process");
      setSentConnections([]);
      setReceivedConnections([]);
      setAcceptedConnections([]);
      return;
    }
    
    // Define each category of connections
    // Only include connections where the user is the sender and the status is anything (pending, accepted, rejected)
    const sent = connections.filter(conn => conn.sender_id === currentUserId) || [];
    
    // Only include connections where the user is the receiver and the status is anything (pending, accepted, rejected)
    const received = connections.filter(conn => conn.receiver_id === currentUserId) || [];
    
    // Only include connections with 'accepted' status where the user is either sender or receiver
    const accepted = connections.filter(conn => 
      (conn.sender_id === currentUserId || conn.receiver_id === currentUserId) && 
      conn.status === 'accepted'
    ) || [];
    
    console.log("Filtered connections:", {
      sent: sent.length,
      sentIds: sent.map(c => c.id),
      received: received.length,
      receivedIds: received.map(c => c.id),
      accepted: accepted.length,
      userId: currentUserId
    });
    
    // Update state with filtered connections
    setSentConnections(sent);
    setReceivedConnections(received);
    setAcceptedConnections(accepted);
    
    // Debug connections
    debugConnections(currentUserId, connections);
  };

  // Debugging function for connections
  const debugConnections = (userId, connections) => {
    if (!connections || !connections.length) {
      console.log("DEBUG: No connections found to debug");
      return;
    }
    
    console.log("==================== CONNECTION DEBUGGING ====================");
    console.log(`Current user ID: ${userId}`);
    
    connections.forEach((conn, index) => {
      const isSender = conn.sender_id === userId;
      const isReceiver = conn.receiver_id === userId;
      const otherPerson = isSender ? conn.receiver : conn.sender;
      
      console.log(`\nCONNECTION #${index + 1}:`);
      console.log(`ID: ${conn.id}`);
      console.log(`Sender ID: ${conn.sender_id}`);
      console.log(`Receiver ID: ${conn.receiver_id}`);
      console.log(`Status: ${conn.status}`);
      console.log(`Created: ${conn.created_at}`);
      console.log(`You are the: ${isSender ? 'SENDER' : 'RECEIVER'}`);
      console.log(`This should show in: ${isSender ? 'SENT REQUESTS' : 'RECEIVED REQUESTS'} tab`);
      console.log(`Sender profile:`, conn.sender?.first_name || 'Missing');
      console.log(`Receiver profile:`, conn.receiver?.first_name || 'Missing');
      console.log(`The other person is: ${otherPerson?.first_name || 'Missing profile'} (${otherPerson?.email || 'No email'})`);
      
      if (conn.status === 'accepted') {
        console.log(`This should ALSO show in: ACCEPTED tab`);
      }
    });
    
    console.log("===============================================================");
  };
  
  useEffect(() => {
    // Only fetch data if auth is ready
    if (!authLoading) {
      fetchUserAndConnections();
    }
    
    // Set up real-time subscription to connections table
    const subscription = supabase
      .channel('connections_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'connections' 
      }, (payload) => {
        console.log('Subscription received payload:', payload);
        fetchUserAndConnections();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [authUser, authLoading]); // Add auth dependencies
  
  const updateConnectionStatus = async (connectionId, newStatus) => {
    try {
      // Ensure we have the authenticated user
      const currentAuthUser = await ensureAuthLoaded();
      if (!currentAuthUser) {
        return;
      }
      
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
        
      if (error) throw error;
      
      toast.success(`Connection request ${newStatus}.`);
      
      // Force refresh of connections data
      await fetchUserAndConnections();
      
      // After accepting, switch to the "accepted" tab
      if (newStatus === 'accepted') {
        setActiveTab('accepted');
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error(`Error updating connection: ${error.message}`);
    }
  };
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200"><Clock size={12} /> Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle size={12} /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200"><X size={12} /> Declined</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">{status || 'Unknown'}</Badge>;
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderUserProfile = (connection, isSent) => {
    const profile = isSent ? connection.receiver : connection.sender;
    
    if (!profile) {
      return (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">Unknown User</CardTitle>
            <CardDescription>Data missing (ID: {isSent ? connection.receiver_id : connection.sender_id})</CardDescription>
          </div>
        </div>
      );
    }
    
    const displayName = profile.first_name ? 
      `${profile.first_name} ${profile.last_name || ''}`.trim() : 
      (profile.username || 'Unknown User');
    
    return (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{profile.first_name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription>{profile.email || ''}</CardDescription>
        </div>
      </div>
    );
  };

  const renderSubjectInfo = (profile) => {
    if (!profile) return null;
    
    return (
      <div className="mt-2 space-y-1 text-sm">
        <div>
          <span className="font-medium text-gray-700">Proficient in:</span> {profile.subject_proficient}
        </div>
        <div>
          <span className="font-medium text-gray-700">Needs help with:</span> {profile.subject_help}
        </div>
      </div>
    );
  };

  const renderAcceptedProfile = (connection) => {
    const isCurrentUserSender = connection.sender_id === userId;
    const profile = isCurrentUserSender ? connection.receiver : connection.sender;
    
    if (!profile) {
      return (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">Unknown User</CardTitle>
            <CardDescription>Data missing (ID: {isCurrentUserSender ? connection.receiver_id : connection.sender_id})</CardDescription>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile.first_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{profile.first_name} {profile.last_name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="font-medium text-gray-700">School:</span> {profile.school}
            </div>
            <div>
              <span className="font-medium text-gray-700">Grade:</span> {profile.grade}
            </div>
            <div>
              <span className="font-medium text-gray-700">Proficient in:</span> {profile.subject_proficient}
            </div>
            <div>
              <span className="font-medium text-gray-700">Needs help with:</span> {profile.subject_help}
            </div>
            {profile.bio && (
              <div>
                <span className="font-medium text-gray-700">Bio:</span> {profile.bio}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleEmailClick = (email) => {
    const currentUserProfile = sentConnections.find(c => c.sender_id === userId)?.sender || 
    receivedConnections.find(c => c.receiver_id === userId)?.receiver ||
    acceptedConnections.find(c => c.sender_id === userId)?.sender ||
    acceptedConnections.find(c => c.receiver_id === userId)?.receiver;
  
    const otherProfile = acceptedConnections.find(c => 
      (c.sender_id === userId && c.receiver.email === email) || 
      (c.receiver_id === userId && c.sender.email === email)
    );
    const profile = otherProfile?.sender_id === userId ? otherProfile.receiver : otherProfile.sender;
    
    const yourName = currentUserProfile?.first_name || '';
    const firstName = profile?.first_name || '';
    const yourSubject = currentUserProfile?.subject_proficient || '';
    const theirSubject = profile?.subject_proficient || '';
    
    const subject = encodeURIComponent("LoopedIn Connection - Accepted");
    const body = encodeURIComponent(`Hey ${firstName},\n\nMy name is ${yourName}, and I just saw that we got matched on LoopedIn! I'm excited to connect and help each other out.\n\nLooks like you're interested in ${theirSubject}, and I'm hoping to get better at ${yourSubject}. Let me know what times work for you to connect!\n\nLooking forward to learning together \n\nBest,\n${yourName}`);
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleCalendarClick = (email, name) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;
    
    const startTime = new Date(today.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    
    const formatTimeForUrl = (date) => {
      return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    };
    
    const formattedStart = formatTimeForUrl(startTime);
    const formattedEnd = formatTimeForUrl(endTime);
    
    const text = encodeURIComponent("LoopedIn Meeting");
    const details = encodeURIComponent(`LoopedIn Tutoring Sesssion with ${name}`);
    const location = encodeURIComponent("Online");
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formattedStart}/${formattedEnd}&details=${details}&location=${location}&add=${email}`;
    
    window.open(calendarUrl, '_blank');
  };

  const refreshConnections = async () => {
    await fetchUserAndConnections();
    toast.success("Connections refreshed");
  };

  if (authLoading || loading) {
    return <div className="container mx-auto py-8 text-center">Loading connections...</div>;
  }

  if (!authUser) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-center p-8 bg-slate-50 rounded-lg max-w-md mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="mb-4">Please sign in to view your connections</p>
          <Button onClick={() => window.location.href = '/login'}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Connections</h1>
        <Button onClick={refreshConnections} variant="outline">
          Refresh
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="received">
            Received Requests
            {receivedConnections.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-primary">{receivedConnections.filter(c => c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Requests
            {sentConnections.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-blue-600">{sentConnections.filter(c => c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted
            {acceptedConnections.length > 0 && (
              <Badge className="ml-2 bg-green-600">{acceptedConnections.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receivedConnections.length > 0 ? (
              receivedConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      {renderUserProfile(connection, false)}
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Request received on {formatDate(connection.created_at)}
                    </p>
                    
                    {renderSubjectInfo(connection.sender)}
                    
                    {connection.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => updateConnectionStatus(connection.id, 'accepted')}
                          className="flex-1"
                        >
                          <Check size={16} className="mr-1" /> Accept
                        </Button>
                        <Button 
                          onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                          variant="outline" 
                          className="flex-1"
                        >
                          <X size={16} className="mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    
                    {connection.status === 'accepted' && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleEmailClick(connection.sender?.email)}
                          className="flex-1 bg-blue-400 text-white hover:text-white hover:bg-blue-500"
                          variant="outline"
                        >
                          <Mail size={16} className="mr-1" /> Email
                        </Button>
                        <Button 
                          onClick={() => handleCalendarClick(connection.sender?.email, connection.sender?.first_name)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Calendar size={16} className="mr-1" /> Schedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-blue-800" />
                <h3 className="mt-2 text-lg font-medium text-blue-600">No connection requests</h3>
                <p className="mt-1 text-blue-300">You haven't received any connection requests yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sent">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sentConnections.length > 0 ? (
              sentConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      {renderUserProfile(connection, true)}
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Request sent on {formatDate(connection.created_at)}
                    </p>
                    
                    {renderSubjectInfo(connection.receiver)}
                    
                    <div className="mt-4">
                      {connection.status === 'pending' && (
                        <div className="flex items-center text-sm text-yellow-600">
                          <Clock size={14} className="mr-1" />
                          <span>Waiting for response</span>
                        </div>
                      )}
                      
                      {connection.status === 'rejected' && (
                        <div className="flex items-center text-sm text-red-600">
                          <X size={14} className="mr-1" />
                          <span>Connection declined</span>
                        </div>
                      )}
                      
                      {connection.status === 'accepted' && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          <span>Connection accepted! View in Accepted tab.</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <Send className="mx-auto h-12 w-12 text-blue-800" />
                <h3 className="mt-2 text-lg font-medium text-blue-600">No sent requests</h3>
                <p className="mt-1 text-blue-300">You haven't sent any connection requests yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="accepted">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {acceptedConnections.length > 0 ? (
              acceptedConnections.map((connection) => {
                const isCurrentUserSender = connection.sender_id === userId;
                const profile = isCurrentUserSender ? connection.receiver : connection.sender;
                const displayName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
                
                return (
                  <Card key={connection.id} className="overflow-hidden bg-blue-50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url}/>
                            <AvatarFallback className="bg-blue-800 text-blue-50" >{profile?.first_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg text-blue-900">{profile?.first_name} {profile?.last_name}</CardTitle>
                            <CardDescription className="text-blue-300">{profile?.email}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge('accepted')}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-1">
                      <div className="space-y-3">
                        <p className="text-sm text-blue-400">
                          Connected since {formatDate(connection.updated_at)}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-blue-800">School:</span> 
                            <p className="mt-1 text-blue-700">{profile?.school}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Grade:</span> 
                            <p className="mt-1 text-blue-700">{profile?.grade}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium text-blue-800">Proficient in:</span> 
                            <p className="mt-1 text-blue-600">{profile?.subject_proficient}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Needs help with:</span> 
                            <p className="mt-1 text-blue-600">{profile?.subject_help}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleEmailClick(profile?.email)}
                          className="flex-1 bg-blue-400 text-white hover:text-white hover:bg-blue-500"
                          variant="outline"
                        >
                          <Mail size={16} className="mr-1" /> Email
                        </Button>
                        <Button 
                          onClick={() => handleCalendarClick(profile?.email, displayName)}
                          className="flex-1 bg-blue-800 hover:bg-blue-700"
                        >
                          <Calendar size={16} className="mr-1" /> Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No accepted connections</h3>
                <p className="mt-1 text-gray-500">You haven't accepted any connection requests yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}