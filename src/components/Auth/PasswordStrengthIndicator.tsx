import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount / requirements.length;

  const getStrengthColor = () => {
    if (strength <= 0.2) return 'bg-destructive';
    if (strength <= 0.4) return 'bg-orange-500';
    if (strength <= 0.6) return 'bg-yellow-500';
    if (strength <= 0.8) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 0.2) return 'Very weak';
    if (strength <= 0.4) return 'Weak';
    if (strength <= 0.6) return 'Fair';
    if (strength <= 0.8) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength <= 0.4 ? "text-destructive" : strength <= 0.6 ? "text-yellow-600" : "text-green-600"
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li 
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
