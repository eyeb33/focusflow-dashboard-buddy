
import React from 'react';
import syllabuddyLogo from '@/assets/syllabuddy-logo.png';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={syllabuddyLogo} alt="Syllabuddy" className="h-32 w-auto" />
      </div>
    </div>
  );
};

export default AuthHeader;
