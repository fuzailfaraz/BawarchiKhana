"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { label: string; href: string };

export function NavHeader({ links }: { links?: NavLink[] }) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const defaultLinks: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const activeLinks = links || defaultLinks;

  return (
    <ul
      className="relative flex w-fit rounded-full border border-white/10 bg-black/40 backdrop-blur-xl p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {activeLinks.map((link) => (
        <Tab key={link.href} setPosition={setPosition} href={link.href}>
          {link.label}
        </Tab>
      ))}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  href
}: {
  children: React.ReactNode;
  setPosition: any;
  href: string;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer"
    >
      <Link 
        href={href}
        className={`block px-4 py-2 text-sm font-semibold transition-colors duration-300 md:px-6 md:py-2.5 md:text-base ${isActive ? 'text-amber-400' : 'text-neutral-300 hover:text-white'}`}
      >
        {children}
      </Link>
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className="absolute z-0 h-9 md:h-[44px] top-1 rounded-full bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    />
  );
};
