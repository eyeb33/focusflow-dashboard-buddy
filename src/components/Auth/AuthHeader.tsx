
import React from 'react';
import logo from '@/assets/logo.png';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <img src={logo} alt="TimeBubble" className="h-32 w-auto" />
      </div>
    </div>
  );
};

export default AuthHeader;
