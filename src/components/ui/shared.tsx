import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
  accent?: string;
}

export function StatCard({ label, value, icon, trend, className, accent }: StatCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-xl p-5 border border-border shadow-sm-custom hover:shadow-md-custom transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium mt-1',
              trend.positive ? 'text-success' : 'text-destructive'
            )}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          accent || 'bg-primary-light'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function StatusBadge({ className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
      className
    )}>
      {children}
    </span>
  );
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarColors = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',
];

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const sizeClass = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }[size];
  return (
    <div className={cn(
      `${sizeClass} rounded-full bg-gradient-to-br ${avatarColors[colorIndex]} flex items-center justify-center font-bold text-white shrink-0`,
      className
    )}>
      {initials}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cn('h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
