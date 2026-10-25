import React from 'react';
import { Sparkles, Award, Star, Printer } from 'lucide-react';
import { Button } from './ui/button';

interface CartPromoPosterProps {
  storeName?: string;
  tagline?: string;
  address?: string;
  phone?: string;
}

export default function CartPromoPoster({
  storeName = 'Namma Ooru Kulfi',
  tagline = '100% Traditional Malai & Pot Kulfi',
  address = 'Sathyamangalam',
  phone = ''
}: CartPromoPosterProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Cart Promo & Loyalty Poster ("Each Kulfi = 3 Points")
        </h3>
        <Button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / Save Poster
        </Button>
      </div>

      <div className="p-1 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-600 to-indigo-600 shadow-xl max-w-lg mx-auto print:max-w-none print:shadow-none print:p-0">
        <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-[15px] text-center space-y-6 relative overflow-hidden border-4 border-amber-400/40">
          
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Customer Loyalty Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text text-transparent pt-2">
              {storeName}
            </h1>
            <p className="text-xs font-bold text-slate-400 tracking-wide">{tagline}</p>
          </div>

          {/* Main Offer Highlight Box */}
          <div className="relative z-10 p-6 rounded-2xl bg-gradient-to-b from-pink-950/80 to-purple-950/80 border-2 border-pink-500/50 shadow-inner space-y-3">
            <div className="flex justify-center items-center gap-1 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
              <Star className="w-6 h-6 fill-amber-400" />
              <Star className="w-5 h-5 fill-amber-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-pink-300">
                Special Cart Offer
              </h2>
              <div className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-amber-300 drop-shadow-md">
                EACH KULFI
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white py-1 flex items-center justify-center gap-2">
                <span className="text-pink-400">=</span> <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">3 POINTS</span> <Award className="w-8 h-8 text-amber-400 inline" />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-300 max-w-xs mx-auto pt-1">
              Collect 3 reward points on every single Kulfi purchase! Redeem points for exciting free treats and special discounts.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold relative z-10">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              🥥 100% Pure Malai
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              🍯 Traditional Pot
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              ⭐ Instant Points
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-semibold text-slate-400 space-y-1 relative z-10">
            <p className="flex items-center justify-center gap-1 text-slate-300">
              📍 {address} {phone ? `• 📞 ${phone}` : ''}
            </p>
            <p className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
              Ask our cart staff to join the loyalty club today! 🍦
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
