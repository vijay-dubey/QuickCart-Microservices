import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 24, color = "#38b2ac" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      fill="none" 
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="logo"
    >
      <path d="M4.08319 9H20.8646L18.1458 15.5H7.1875M18 18H7.5L5.5 4H3" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="16.5" cy="20" r="1.5" />
    </svg>
  );
};

export default Logo; 