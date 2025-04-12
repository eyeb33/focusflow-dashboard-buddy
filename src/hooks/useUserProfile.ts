
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfile;
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Query for profile data
  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) {
        throw new Error('No user authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for uploading avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('No user authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return publicUrl;
    },
    onSuccess: () => {
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    profile: profileQuery.data,
    loading: profileQuery.isLoading,
    updating: updateProfileMutation.isPending || uploadAvatarMutation.isPending,
    fetchProfile: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
  };
};
