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
    const result = calculatePrediction(entries, isWeekend, isHoliday, weatherCondition, targetDate);
    
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className={cardBg}>
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5" /> 1. Select Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5 pt-4">
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
                </div>
              </div>

              {/* Weather Adjustment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Weather Outlook
                  </Label>
                  
                </div>

                {/* Sathyamangalam Auto-Fetch Weather Widget */}
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {weatherCondition === 'rain' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <CloudRain className="w-5 h-5 animate-bounce" />
                      </div>
                    ) : weatherCondition === 'hot' ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Sun className="w-5 h-5 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                        <CloudSun className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Sathyamangalam</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Live Sync</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {weatherLoading ? (
                          <span className="animate-pulse">Loading Live Weather...</span>
                        ) : weatherError ? (
                          <span className="text-rose-500">{weatherError}</span>
                        ) : (() => {
                          const matching = forecasts.find(f => f.date === targetDate);
                          if (matching) {
                            const desc = matching.precipitation > 1.0 
                              ? 'Showers / Rainy' 
                              : matching.tempMax >= 31.0 
                                ? 'Sunny & Hot' 
                                : 'Moderate Temperature';
                            return (
                              <span className="font-semibold">
                                <span className="font-black text-slate-800 dark:text-slate-200">{matching.tempMax.toFixed(1)}°C</span> — {desc} {userOverrodeWeather ? '(Overridden)' : '(Auto)'}
                              </span>
                            );
                          }
                          return <span className="text-slate-400">No forecast found for selected date</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWeatherCondition('rain');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weatherCondition === 'rain'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 mb-0.5" />
                    <span>Rainy (-30%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeatherCondition('normal');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weatherCondition === 'normal'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <CloudSun className="w-4 h-4 mb-0.5" />
                    <span>Normal (0%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeatherCondition('hot');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weatherCondition === 'hot'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 mb-0.5" />
                    <span>Sunny (+20%)</span>
                  </button>
                </div>
              </div>

              {/* Event Adjustment */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Event / Crowd Factor
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHoliday(false)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      !isWeekend && !isHoliday
                        ? 'bg-slate-500 text-white border-slate-500'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <span>Normal</span>
                  </button>
                  <button
                    type="button"
                    disabled={true}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      isWeekend
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <span>Weekend (+20%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHoliday(true)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      isHoliday
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <PartyPopper className="w-4 h-4 mb-0.5" />
                    <span>Holiday (+30%)</span>
                  </button>
                </div>
              </div>

              
                
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Analytical Summary */}
        <div className="space-y-6 lg:col-span-2">
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
    </div>
  );
}
