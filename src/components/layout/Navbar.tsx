'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/play', label: 'Play' },
    { href: '/about', label: 'About' },
    { href: '/join', label: 'Join' },
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
        isScrolled ? 'glass-panel' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="font-display font-bold text-2xl tracking-tight">
            <span className="text-brand-blue">GALAW</span>
            <span className="text-brand-red"> PINOY</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex list-none gap-8 items-center m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.href} className="m-0 p-0">
              <Link
                href={link.href}
                className={clsx(
                  'text-sm font-medium relative py-2 transition-colors duration-150',
                  pathname === link.href
                    ? 'text-brand-dark'
                    : 'text-neutral-600 hover:text-brand-dark'
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link href="/play">
            <Button variant="primary" className="text-sm px-4 py-2">
              Play Now
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-2"
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-brand-dark transition-all duration-250 rounded" />
          <span className="block w-6 h-0.5 bg-brand-dark transition-all duration-250 rounded" />
          <span className="block w-6 h-0.5 bg-brand-dark transition-all duration-250 rounded" />
        </button>
      </div>
    </nav>
  );
}

