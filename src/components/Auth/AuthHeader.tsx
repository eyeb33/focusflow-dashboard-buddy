
import React from 'react';
import syllabuddyLogoLight from '@/assets/syllabuddy-logo-light.png';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={syllabuddyLogoLight} alt="Syllabuddy" className="h-32 w-auto" />
      </div>
    </div>
  );
};

export default AuthHeader;
