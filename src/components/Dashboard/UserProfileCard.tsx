import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from '@/contexts/AuthContext';

const UserProfileCard: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, updating, uploadAvatar } = useUserProfile();
  const [username, setUsername] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setUsername(profile.username || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');
    }
  }, [profile, user]);

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    await uploadAvatar(event.target.files[0]);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card className="mb-6">
      <CardContent className="py-6">
        <div className="flex flex-col items-center space-y-4">
          <ProfileAvatar 
            avatarUrl={profile?.avatar_url} 
            username={username} 
            uploading={updating} 
            uploadAvatar={handleUploadAvatar} 
            getInitials={getInitials}
          />
          
          <ProfileWelcome loading={loading} username={username} />
        </div>
      </CardContent>
    </Card>
  );
};

interface ProfileAvatarProps {
  avatarUrl: string | null;
  username: string | null;
  uploading: boolean;
  uploadAvatar: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  getInitials: (name: string | null) => string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  avatarUrl, 
  username, 
  uploading, 
  uploadAvatar, 
  getInitials 
}) => {
  return (
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
  );
};

interface ProfileWelcomeProps {
  loading: boolean;
  username: string | null;
}

const ProfileWelcome: React.FC<ProfileWelcomeProps> = ({ loading, username }) => {
  return (
    <div className="text-center">
      <h3 className="text-xl font-medium">
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>Welcome, {username || 'User'}!</>
        )}
      </h3>
    </div>
  );
};

export default UserProfileCard;
