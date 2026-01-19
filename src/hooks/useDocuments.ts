import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message: string | null;
  total_chunks: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Set up realtime subscription for document status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as Document, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => 
              prev.map(doc => doc.id === payload.new.id ? payload.new as Document : doc)
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const uploadDocument = async (file: File, title: string) => {
    if (!user) {
      toast.error('You must be logged in to upload documents');
      return null;
    }

    setIsUploading(true);

    try {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('curriculum-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/pdf',
          status: 'pending',
          metadata: {},
        })
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file
        await supabase.storage.from('curriculum-documents').remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      toast.success('Document uploaded! Processing will begin shortly.');

      // Trigger background processing
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { document_id: document.id },
      });

      if (processError) {
        console.error('Error triggering processing:', processError);
        toast.error('Document uploaded but processing failed to start');
      }

      return document as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reprocessDocument = async (documentId: string) => {
    try {
      // Update status to pending
      await supabase
        .from('documents')
        .update({ status: 'pending', error_message: null })
        .eq('id', documentId);

      // Trigger reprocessing
      const { error } = await supabase.functions.invoke('process-document', {
        body: { document_id: documentId },
      });

      if (error) {
        throw error;
      }

      toast.success('Reprocessing started');
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast.error('Failed to reprocess document');
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      
      if (document) {
        // Delete file from storage
        await supabase.storage
          .from('curriculum-documents')
          .remove([document.file_path]);
      }

      // Delete document record (chunks will cascade)
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return {
    documents,
    isLoading,
    isUploading,
    uploadDocument,
    reprocessDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
};
