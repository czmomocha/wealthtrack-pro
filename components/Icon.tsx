
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className = "", size = 20 }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) return <LucideIcons.HelpCircle className={className} size={size} />;
  return <LucideIcon className={className} size={size} />;
};

export default Icon;
