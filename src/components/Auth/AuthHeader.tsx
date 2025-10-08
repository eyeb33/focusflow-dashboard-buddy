
import React from 'react';
import logo from '@/assets/logo.png';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 justify-center">
        <img src={logo} alt="TimeBubble" className="h-30 w-30" />
        <span className="text-2xl font-bold">TimeBubble</span>
      </div>
    </div>
  );
};

export default AuthHeader;
