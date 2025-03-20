"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Prediction', href: '/prediction' },
    { label: 'Analysis', href: '/analysis' },
    { label: 'Documentation', href: '/docs' },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <svg 
            viewBox="0 0 24 24" 
            className="h-6 w-6"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="m9 15 3 3 3-3" />
          </svg>
          <span className="text-lg font-medium text-gray-900">Smart Grid Stability Analysis</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          {navItems.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`text-sm hover:text-black transition-colors ${
                pathname === item.href ? 'text-black font-medium' : 'text-gray-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;