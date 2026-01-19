import React from 'react';
import { DocumentUploadCard } from './DocumentUploadCard';
import { DocumentList } from './DocumentList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const CurriculumManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle>RAG-Powered Curriculum Knowledge</AlertTitle>
        <AlertDescription>
          Upload curriculum documents (PDFs) to enhance the AI tutor with official specification content.
          When students ask questions, the AI will retrieve relevant sections and cite them in responses.
        </AlertDescription>
      </Alert>

      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Admin Only</AlertTitle>
        <AlertDescription>
          Only you (the project owner) can upload and manage curriculum documents.
          All authenticated students can benefit from the enhanced AI responses.
        </AlertDescription>
      </Alert>

      <DocumentUploadCard />
      <DocumentList />
    </div>
  );
};
