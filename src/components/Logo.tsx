import React from 'react';
export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-[2px] ${className}`}>
      <div className="flex w-full h-full items-center justify-center rounded-full bg-slate-950 text-white font-black text-xl tracking-tighter">
        NK
      </div>
    </div>
  );
}