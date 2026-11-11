import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-[#2563EB]',
}) => {
  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-500 truncate mr-2">
          {title}
        </span>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <h3 className="text-lg sm:text-2xl font-bold text-[#142B4A] tracking-tight">{value}</h3>
        {subtitle && <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  );
};

