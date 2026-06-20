import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  iconOnly?: boolean;
}

export function Logo({ className, onClick, iconOnly = false }: LogoProps) {
  return (
    <Link 
      href="/" 
      onClick={onClick}
      className={cn("flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02] active:scale-95", className)}
    >
      <div className="flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-0.5">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Document Shape */}
          <path d="M15 20C15 14.4772 19.4772 10 25 10H55L85 40V80C85 85.5228 80.5228 90 75 90H25C19.4772 90 15 85.5228 15 80V20Z" stroke="#0B60B0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Document Lines */}
          <path d="M30 40H60M30 55H50M30 70H45" stroke="#0B60B0" strokeWidth="6" strokeLinecap="round"/>
          {/* Folded Corner */}
          <path d="M55 10V40H85" stroke="#0B60B0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Green Check Circle overlay */}
          <circle cx="75" cy="75" r="25" fill="#fff"/>
          <circle cx="75" cy="75" r="21" stroke="#21A142" strokeWidth="8"/>
          {/* Check mark inside circle */}
          <path d="M63 75L71 83L87 65" stroke="#21A142" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {!iconOnly && (
        <div className="flex items-baseline ml-1 text-[24px] font-extrabold tracking-tight">
          <span className="text-[#0B355A]">Invoice</span>
          <span className="text-[#21A142] ml-1.5">Now</span>
        </div>
      )}
    </Link>
  );
}
