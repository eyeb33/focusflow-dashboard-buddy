
import React from 'react';
import summitLogo from '@/assets/summit-logo.png';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={summitLogo} alt="Summit" className="h-32 w-auto" />
      </div>
    </div>
  );
};

export default AuthHeader;
