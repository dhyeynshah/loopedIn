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
import { useAuth } from '@/context/AuthContext';
import UserDropdownNav from './dropdown';

export default function Connections() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const [sentConnections, setSentConnections] = useState([]);
  const [receivedConnections, setReceivedConnections] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
  const supabase = createClientComponentClient();

  const ensureAuthLoaded = async () => {
    if (!authUser) {
      const newUser = await refreshSession();
      if (!newUser) {
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
      
      const currentAuthUser = await ensureAuthLoaded();
      if (!currentAuthUser) {
        setLoading(false);
        return;
      }
      
      setUserId(currentAuthUser.id);
      
      const { data: allConnections, error: allConnError } = await supabase
        .from('connections')
        .select('*');
        
      if (allConnError) {
        console.error('Error fetching all connections:', allConnError);
      }
      
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
      
      if (!connections || connections.length === 0) {
        const { data: connections1, error: connError1 } = await supabase
          .from('connections')
          .select(`
            *,
            sender:profiles(*),
            receiver:profiles(*)
          `)
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        if (!connError1 && connections1 && connections1.length > 0) {
          processConnections(connections1, currentAuthUser.id);
          setLoading(false);
          return;
        }
        
        const { data: connections2, error: connError2 } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${currentAuthUser.id},receiver_id.eq.${currentAuthUser.id}`);
          
        if (!connError2 && connections2 && connections2.length > 0) {
          for (const conn of connections2) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conn.sender_id)
              .single();
              
            const { data: receiverProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conn.receiver_id)
              .single();
              
            conn.sender = senderProfile;
            conn.receiver = receiverProfile;
          }
          
          processConnections(connections2, currentAuthUser.id);
          setLoading(false);
          return;
        }
      }
      
      processConnections(connections, currentAuthUser.id);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Error loading connections: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const processConnections = (connections, currentUserId) => {
    if (!connections || connections.length === 0) {
      setSentConnections([]);
      setReceivedConnections([]);
      setAcceptedConnections([]);
      return;
    }
    
    const sent = connections.filter(conn => conn.sender_id === currentUserId) || [];
    const received = connections.filter(conn => conn.receiver_id === currentUserId) || [];
    const accepted = connections.filter(conn => 
      (conn.sender_id === currentUserId || conn.receiver_id === currentUserId) && 
      conn.status === 'accepted'
    ) || [];
    
    setSentConnections(sent);
    setReceivedConnections(received);
    setAcceptedConnections(accepted);
    
    debugConnections(currentUserId, connections);
  };

  const debugConnections = (userId, connections) => {
    if (!connections || !connections.length) {
      return;
    }
    
    connections.forEach((conn, index) => {
      const isSender = conn.sender_id === userId;
      const isReceiver = conn.receiver_id === userId;
      const otherPerson = isSender ? conn.receiver : conn.sender;
    });
  };
  
  useEffect(() => {
    if (!authLoading) {
      fetchUserAndConnections();
    }
    
    const subscription = supabase
      .channel('connections_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'connections' 
      }, (payload) => {
        fetchUserAndConnections();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [authUser, authLoading]);
  
  const updateConnectionStatus = async (connectionId, newStatus) => {
    try {
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
      
      await fetchUserAndConnections();
      
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
        return <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200"><Clock size={12} /> Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="flex items-center gap-1 bg-gray-900 text-white border-gray-900"><CheckCircle size={12} /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="flex items-center gap-1 bg-gray-100 text-gray-600 border-gray-300"><X size={12} /> Declined</Badge>;
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
          <AvatarFallback className="bg-black text-white">{profile.first_name?.charAt(0) || '?'}</AvatarFallback>
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
            <AvatarFallback className="bg-black text-white">{profile.first_name?.charAt(0) || '?'}</AvatarFallback>
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
        <div className="text-center p-8 bg-gray-50 rounded-lg max-w-md mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="mb-4">Please sign in to view your connections</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-black hover:bg-gray-800 text-white">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Connections</h1>
        <div className="flex items-center gap-4">
        <Button onClick={refreshConnections} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
          Refresh
        </Button>
        <UserDropdownNav />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="received">
            Received Requests
            {receivedConnections.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-black text-white">{receivedConnections.filter(c => c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Requests
            {sentConnections.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-gray-800 text-white">{sentConnections.filter(c => c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted
            {acceptedConnections.length > 0 && (
              <Badge className="ml-2 bg-gray-600 text-white">{acceptedConnections.length}</Badge>
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
                          className="flex-1 bg-black hover:bg-gray-800 text-white"
                        >
                          <Check size={16} className="mr-1" /> Accept
                        </Button>
                        <Button 
                          onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                          variant="outline" 
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          <X size={16} className="mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    
                    {connection.status === 'accepted' && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleEmailClick(connection.sender?.email)}
                          className="flex-1 bg-gray-600 text-white hover:bg-gray-700"
                          variant="outline"
                        >
                          <Mail size={16} className="mr-1" /> Email
                        </Button>
                        <Button 
                          onClick={() => handleCalendarClick(connection.sender?.email, connection.sender?.first_name)}
                          className="flex-1 bg-black hover:bg-gray-800 text-white"
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
                <AlertCircle className="mx-auto h-12 w-12 text-gray-800" />
                <h3 className="mt-2 text-lg font-medium text-gray-600">No connection requests</h3>
                <p className="mt-1 text-gray-500">You haven't received any connection requests yet.</p>
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
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          <span>Waiting for response</span>
                        </div>
                      )}
                      
                      {connection.status === 'rejected' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <X size={14} className="mr-1" />
                          <span>Connection declined</span>
                        </div>
                      )}
                      
                      {connection.status === 'accepted' && (
                        <div className="flex items-center text-sm text-gray-600">
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
                <Send className="mx-auto h-12 w-12 text-gray-800" />
                <h3 className="mt-2 text-lg font-medium text-gray-600">No sent requests</h3>
                <p className="mt-1 text-gray-500">You haven't sent any connection requests yet.</p>
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
                  <Card key={connection.id} className="overflow-hidden bg-gray-50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url}/>
                            <AvatarFallback className="bg-black text-white">{profile?.first_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg text-gray-900">{profile?.first_name} {profile?.last_name}</CardTitle>
                            <CardDescription className="text-gray-600">{profile?.email}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge('accepted')}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-1">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                          Connected since {formatDate(connection.updated_at)}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-800">School:</span> 
                            <p className="mt-1 text-gray-700">{profile?.school}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Grade:</span> 
                            <p className="mt-1 text-gray-700">{profile?.grade}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium text-gray-800">Proficient in:</span> 
                            <p className="mt-1 text-gray-600">{profile?.subject_proficient}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Needs help with:</span> 
                            <p className="mt-1 text-gray-600">{profile?.subject_help}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleEmailClick(profile?.email)}
                          className="flex-1 bg-gray-600 text-white hover:bg-gray-700"
                          variant="outline"
                        >
                          <Mail size={16} className="mr-1" /> Email
                        </Button>
                        <Button 
                          onClick={() => handleCalendarClick(profile?.email, displayName)}
                          className="flex-1 bg-black hover:bg-gray-800 text-white"
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