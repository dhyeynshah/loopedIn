"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_error');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        if (data.session) {
          router.push('/profile');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/login?error=unexpected_error');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}