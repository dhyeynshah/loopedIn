"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Connections() {
  const [sentConnections, setSentConnections] = useState([]);
  const [receivedConnections, setReceivedConnections] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  useEffect(() => {
    const fetchUserAndConnections = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!user) {
          toast.error("Please sign in to view your connections");
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        const { data: connections, error: connError } = await supabase
          .from('connections')
          .select(`
            *,
            sender:profiles!sender_id(*),
            receiver:profiles!receiver_id(*)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          
        if (connError) {
          console.error('Error fetching connections:', connError);
          throw connError;
        }
        
        const sent = connections?.filter(conn => 
          conn.sender_id === user.id && conn.status !== 'accepted'
        ) || [];
        
        const received = connections?.filter(conn => 
          conn.receiver_id === user.id && conn.status === 'pending'
        ) || [];
        
        const accepted = connections?.filter(conn => 
          (conn.sender_id === user.id || conn.receiver_id === user.id) && 
          conn.status === 'accepted'
        ) || [];
        
        setSentConnections(sent);
        setReceivedConnections(received);
        setAcceptedConnections(accepted);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(`Error loading connections: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndConnections();
  }, []);
  
  const updateConnectionStatus = async (connectionId, newStatus) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
        
      if (error) throw error;
      
      toast.success(`You have ${newStatus} the connection request.`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: connections } = await supabase
          .from('connections')
          .select(`
            *,
            sender:profiles!sender_id(*),
            receiver:profiles!receiver_id(*)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          
        const sent = connections?.filter(conn => 
          conn.sender_id === user.id && conn.status !== 'accepted'
        ) || [];
        
        const received = connections?.filter(conn => 
          conn.receiver_id === user.id && conn.status === 'pending'
        ) || [];
        
        const accepted = connections?.filter(conn => 
          (conn.sender_id === user.id || conn.receiver_id === user.id) && 
          conn.status === 'accepted'
        ) || [];
        
        setSentConnections(sent);
        setReceivedConnections(received);
        setAcceptedConnections(accepted);
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
        return null;
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
            <CardDescription>Data missing</CardDescription>
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
            <CardDescription>Data missing</CardDescription>
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
    const subject = encodeURIComponent("SkillExchange Connection");
    const body = encodeURIComponent("Hello, I'm reaching out from SkillExchange! Looking forward to connecting with you.");
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
    
    const text = encodeURIComponent("SkillExchange Meeting");
    const details = encodeURIComponent(`SkillExchange tutoring/learning session with ${name}`);
    const location = encodeURIComponent("Online");
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formattedStart}/${formattedEnd}&details=${details}&location=${location}&add=${email}`;
    
    window.open(calendarUrl, '_blank');
  };

  const refreshConnections = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        setUserId(user.id);
        
        const { data: connections, error: connError } = await supabase
          .from('connections')
          .select(`
            *,
            sender:profiles!sender_id(*),
            receiver:profiles!receiver_id(*)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          
        if (connError) throw connError;
        
        const sent = connections?.filter(conn => 
          conn.sender_id === user.id && conn.status !== 'accepted'
        ) || [];
        
        const received = connections?.filter(conn => 
          conn.receiver_id === user.id && conn.status === 'pending'
        ) || [];
        
        const accepted = connections?.filter(conn => 
          (conn.sender_id === user.id || conn.receiver_id === user.id) && 
          conn.status === 'accepted'
        ) || [];
        
        setSentConnections(sent);
        setReceivedConnections(received);
        setAcceptedConnections(accepted);
      }
    } catch (error) {
      console.error('Error refreshing connections:', error);
      toast.error(`Error refreshing connections: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading connections...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Connections</h1>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="received">
            Received Requests
            {receivedConnections.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-primary">{receivedConnections.filter(c => c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No connection requests</h3>
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
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No sent requests</h3>
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
                  <Card key={connection.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback>{profile?.first_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{profile?.first_name} {profile?.last_name}</CardTitle>
                            <CardDescription>{profile?.email}</CardDescription>
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
                            <span className="font-medium text-gray-700">School:</span> 
                            <p className="mt-1">{profile?.school}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Grade:</span> 
                            <p className="mt-1">{profile?.grade}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium text-gray-700">Proficient in:</span> 
                            <p className="mt-1">{profile?.subject_proficient}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Needs help with:</span> 
                            <p className="mt-1">{profile?.subject_help}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleEmailClick(profile?.email)}
                          className="flex-1"
                          variant="outline"
                        >
                          <Mail size={16} className="mr-1" /> Email
                        </Button>
                        <Button 
                          onClick={() => handleCalendarClick(profile?.email, displayName)}
                          className="flex-1"
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