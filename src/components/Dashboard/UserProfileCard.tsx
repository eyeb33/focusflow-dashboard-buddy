
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

const UserProfileCard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({ username: null, avatar_url: null });
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the user's profile with the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card className="mb-6">
      <CardContent className="py-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username || 'User'} />
              ) : (
                <AvatarFallback className="bg-pomodoro-work text-white text-xl">
                  {getInitials(username)}
                </AvatarFallback>
              )}
            </Avatar>
            {!avatarUrl && (
              <label 
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white rounded-full p-2 cursor-pointer"
                htmlFor="avatar-upload"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="hidden"
              disabled={uploading}
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-medium">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                </div>
              ) : (
                <>Welcome back, {username || 'User'}!</>
              )}
            </h3>
            {!avatarUrl && (
              <p className="text-sm text-muted-foreground mt-2">
                Add a profile picture by clicking the camera icon
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
