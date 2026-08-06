import React, { useState, useMemo, useEffect } from 'react';
import { useEntries, useInventory } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { format, parseISO, addDays, getDay } from 'date-fns';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Sun, 
  CloudRain, 
  CloudSun, 
  PartyPopper, 
  CheckSquare, 
  Square, 
  Printer, 
  Copy, 
  Check, 
  ArrowRight, 
  Package, 
  Info,
  Layers,
  ListChecks,
  RefreshCw,
  Thermometer,
  Cloud
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useWeather } from '../lib/useWeather';
import { calculatePrediction } from '../lib/prediction';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

interface DailyForecast {
  date: string;
  tempMax: number;
  weatherCode: number;
  precipitation: number;
}

export default function Planner() {
  const { entries, loading: entriesLoading } = useEntries();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Target planning date (defaults to tomorrow)
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [targetDate, setTargetDate] = useState(tomorrowStr);

  const { getWeatherForDate, weatherLoading, weatherError, forecasts } = useWeather();
  const autoWeather = getWeatherForDate(targetDate);
  
  const [userOverrodeWeather, setUserOverrodeWeather] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'normal' | 'hot' | 'rain'>('normal');
  const [isHoliday, setIsHoliday] = useState(false);
  const [season, setSeason] = useState<'summer' | 'winter' | 'monsoon' | 'spring' | 'normal'>('normal');
  
  useEffect(() => {
    setUserOverrodeWeather(false);
  }, [targetDate]);

  useEffect(() => {
    if (!userOverrodeWeather && autoWeather) {
      setWeatherCondition(autoWeather === 'rainy' ? 'rain' : autoWeather);
    }
  }, [autoWeather, userOverrodeWeather]);
  
  const loading = entriesLoading || inventoryLoading;

  // Auto-detect weekend if target date is Saturday/Sunday
  const targetDayOfWeekIndex = useMemo(() => {
    try {
      return getDay(parseISO(targetDate));
    } catch {
      return 1;
    }
  }, [targetDate]);
  const targetDayName = DAYS_OF_WEEK[targetDayOfWeekIndex];
  const isWeekend = targetDayOfWeekIndex === 0 || targetDayOfWeekIndex === 6;

  // Calculations
  const calculations = useMemo(() => {
    const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition, season, targetDate);
    
    // Calculate shortage based on current stock
    const relevantEntries = inventory?.lastUpdatedDate 
      ? entries.filter(e => e.date >= inventory.lastUpdatedDate)
      : entries;
    const totalStickSold = relevantEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSold = relevantEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const availableStick = Math.max(0, (inventory?.stickQuantity || 0) - totalStickSold);
    const availablePot = Math.max(0, (inventory?.potQuantity || 0) - totalPotSold);
    
    return {
      histAvgStick: result.histAvgStick,
      histAvgPot: result.histAvgPot,
      dayOfWeekAvgStick: result.dayOfWeekAvgStick,
      dayOfWeekAvgPot: result.dayOfWeekAvgPot,
      recent7DayAvgStick: result.recent7DayAvgStick,
      recent7DayAvgPot: result.recent7DayAvgPot,
      predictedStick: result.stick,
      predictedPot: result.pot,
      availableStick,
      availablePot,
      shortageStick: Math.max(0, result.stick - availableStick),
      shortagePot: Math.max(0, result.pot - availablePot),
      multiplier: result.multiplier,
      hasData: result.hasData
    };
  }, [entries, inventory, isWeekend, isHoliday, weatherCondition]);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">
        Analyzing Outpost Logs & Inventory...
      </div>
    );
  }

  const labelColor = isDark ? 'text-slate-400' : 'text-slate-600 font-extrabold';
  const cardBg = isDark ? 'bg-[#111827]/60 border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className="p-6 space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isDark ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800' : 'text-cyan-700 bg-cyan-50 border border-cyan-100'
            }`}>
              Smart Intelligence
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-pink-500 animate-pulse" /> Demand & Prep Planner
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Predict inventory demand using weighted historical velocity, day-of-week trends, and environmental adjustments.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Input Panel */}
        <Card className={isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}>
          <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5" /> 1. Select Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Target Planning Date
                </Label>
                <div className="relative">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border text-sm font-bold uppercase ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  Target day: <span className="text-cyan-500 font-black">{targetDayName}</span>
                  {isWeekend && <span className="ml-2 text-amber-500 font-bold">(Weekend Modifier Active)</span>}
                </div>
              </div>

              {/* Weather Adjustment */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Weather Condition
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setWeatherCondition('normal'); setUserOverrodeWeather(true); }}
                    className={`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      weatherCondition === 'normal'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <CloudSun className="w-4 h-4" /> Normal
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('hot'); setUserOverrodeWeather(true); }}
                    className={`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      weatherCondition === 'hot'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Hot (+15%)
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('rain'); setUserOverrodeWeather(true); }}
                    className={`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      weatherCondition === 'rain'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <CloudRain className="w-4 h-4" /> Rain (-30%)
                  </button>
                </div>
              </div>

              {/* Season Selection */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Season
                </Label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as any)}
                  className={`w-full h-11 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-pink-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500'
                  }`}
                >
                  <option value="normal">Normal / Neutral</option>
                  <option value="summer">Summer Peak (+25%)</option>
                  <option value="winter">Winter Slowdown (-15%)</option>
                  <option value="monsoon">Monsoon / Rainy Season (-10%)</option>
                  <option value="spring">Spring / Festival (+5%)</option>
                </select>
              </div>

              {/* Special Events */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Special Events
                </Label>
                <button
                  onClick={() => setIsHoliday(!isHoliday)}
                  className={`w-full h-11 px-4 flex items-center justify-between rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    isHoliday
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : isDark
                        ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                        : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-4 h-4 mb-0.5" />
                    <span>Holiday / Festival</span>
                  </div>
                  {isHoliday ? (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white">+30%</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">+30% Boost</span>
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytical Summary */}
        <Card className={`overflow-hidden border transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-100 shadow-lg shadow-slate-100'}`}>
            <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> Preparation Targets
              </CardTitle>
              {inventory?.lastUpdatedDate && (
                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                  Stock Date: {inventory.lastUpdatedDate}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Item</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Predicted</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Available</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Target to Prepare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Stick Kulfi Row */}
                    <tr className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-cyan-500" />
                          <span className="font-black text-slate-800 dark:text-slate-200">Stick Kulfi</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-cyan-500">{calculations.predictedStick}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-slate-500">{calculations.availableStick}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={`inline-flex items-center justify-end gap-2 px-3 py-1.5 rounded-lg border ${
                          calculations.shortageStick > 0 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {calculations.shortageStick > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Prepare</span>
                              <span className="text-lg font-black">+{calculations.shortageStick}</span>
                            </>
                          ) : (
                            <span className="text-xs font-black uppercase tracking-wider">Sufficient</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Pot Kulfi Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-pink-500" />
                          <span className="font-black text-slate-800 dark:text-slate-200">Pot Kulfi</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-pink-500">{calculations.predictedPot}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-slate-500">{calculations.availablePot}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">pcs</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={`inline-flex items-center justify-end gap-2 px-3 py-1.5 rounded-lg border ${
                          calculations.shortagePot > 0 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {calculations.shortagePot > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Prepare</span>
                              <span className="text-lg font-black">+{calculations.shortagePot}</span>
                            </>
                          ) : (
                            <span className="text-xs font-black uppercase tracking-wider">Sufficient</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              
              {/* Flavour Wise Distribution */}
              {(calculations.shortageStick > 0 || calculations.shortagePot > 0) && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-pink-500" /> Smart Flavour Distribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {calculations.shortageStick > 0 && (
                      <div>
                        <h5 className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Stick Kulfi Breakdown</h5>
                        <div className="space-y-2">
                          {inventory?.stickFlavours && inventory.stickFlavours.length > 0 ? (
                            inventory.stickFlavours.map((f, i) => {
                              const share = Math.round(calculations.shortageStick / inventory.stickFlavours!.length);
                              return (
                                <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs">
                                  <span className="dark:text-slate-300 font-medium">{f.name || 'Unnamed'}</span>
                                  <span className="font-black text-cyan-600 dark:text-cyan-400">+{i === inventory.stickFlavours!.length - 1 ? calculations.shortageStick - (share * i) : share}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic">No stick flavours configured.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {calculations.shortagePot > 0 && (
                      <div>
                        <h5 className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-3">Pot Kulfi Breakdown</h5>
                        <div className="space-y-2">
                          {inventory?.potFlavours && inventory.potFlavours.length > 0 ? (
                            inventory.potFlavours.map((f, i) => {
                              const share = Math.round(calculations.shortagePot / inventory.potFlavours!.length);
                              return (
                                <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs">
                                  <span className="dark:text-slate-300 font-medium">{f.name || 'Unnamed'}</span>
                                  <span className="font-black text-pink-600 dark:text-pink-400">+{i === inventory.potFlavours!.length - 1 ? calculations.shortagePot - (share * i) : share}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic">No pot flavours configured.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advanced Intelligence Details */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Underlying Intelligence metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">7-Day Avg</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.recent7DayAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.recent7DayAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{targetDayName.substring(0,3)} Avg</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.dayOfWeekAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.dayOfWeekAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historical</p>
                    <div className="flex items-center gap-3">
                      <div><span className="text-cyan-500 font-black">{calculations.histAvgStick}</span> <span className="text-[10px] text-slate-500 font-bold">STK</span></div>
                      <div><span className="text-pink-500 font-black">{calculations.histAvgPot}</span> <span className="text-[10px] text-slate-500 font-bold">POT</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Modifier</p>
                    <div className="flex items-center">
                      <span className={`text-sm font-black ${calculations.multiplier > 1 ? 'text-amber-500' : calculations.multiplier < 1 ? 'text-blue-500' : 'text-slate-500'}`}>
                        {calculations.multiplier > 1 ? '+' : calculations.multiplier < 1 ? '' : ''}{Math.round((calculations.multiplier - 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
