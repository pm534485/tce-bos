import React from 'react';

interface TceLogoProps {
  variant?: 'full' | 'compact' | 'light' | 'white';
  className?: string;
  subtext?: string;
}

export const TceLogo: React.FC<TceLogoProps> = ({
  variant = 'full',
  className = '',
  subtext = 'An Autonomous Institution Affiliated to Anna University',
}) => {
  const isWhite = variant === 'white';
  const isCompact = variant === 'compact';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Official TCE Logo */}
      <img
        src="/tce-logo.png"
        alt="TCE Logo"
        className="w-10 h-10 object-contain drop-shadow-sm flex-shrink-0"
      />

      {/* Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center space-x-2">
          <span
            className={`font-extrabold tracking-tight font-tce text-base sm:text-lg ${
              isWhite ? 'text-white' : 'text-[#7B1113]'
            }`}
          >
            THIAGARAJAR COLLEGE OF ENGINEERING
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C59B27] text-white tracking-widest hidden sm:inline-block">
            ESTD. 1957
          </span>
        </div>
        {!isCompact && (
          <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 mt-0.5">
            <span className={isWhite ? 'text-slate-200' : 'text-slate-600'}>
              {subtext}
            </span>
            <span className="text-[#C59B27] font-semibold hidden md:inline">• Madurai - 625 015</span>
          </div>
        )}
      </div>
    </div>
  );
};
