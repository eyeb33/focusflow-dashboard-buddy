import React from 'react';
import { Helmet } from 'react-helmet';
import { CurriculumManager } from '@/components/RAG/CurriculumManager';
import Header from '@/components/Layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hardcoded admin user ID - only this user can access this page
const ADMIN_USER_ID = '9d326b17-8987-4a2f-a104-0ef900b6c382';

const Curriculum: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect non-admin users
  if (!user || user.id !== ADMIN_USER_ID) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Curriculum Manager - Syllabuddy</title>
      </Helmet>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Focus
              </Button>
              <h1 className="text-3xl font-bold">Curriculum Manager</h1>
              <p className="text-muted-foreground mt-1">
                Upload and manage curriculum documents for RAG-enhanced AI tutoring
              </p>
            </div>
            <CurriculumManager />
          </div>
        </main>
      </div>
    </>
  );
};

export default Curriculum;
