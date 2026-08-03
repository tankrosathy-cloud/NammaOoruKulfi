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

  // Live weather sync states
  const [forecasts, setForecasts] = useState<DailyForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [userOverrodeWeather, setUserOverrodeWeather] = useState(false);

  // Environmental and custom modifiers
  const [weather, setWeather] = useState<'normal' | 'hot' | 'rainy'>('normal');
  const [event, setEvent] = useState<'normal' | 'weekend' | 'festival'>('normal');
  const [manualBooster, setManualBooster] = useState<number>(0);

  // Checklist states
  const [stickChecked, setStickChecked] = useState(false);
  const [potChecked, setPotChecked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch real weather forecast for Sathyamangalam from Open-Meteo
  const fetchWeatherForecast = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=11.5014&longitude=77.2444&daily=weather_code,temperature_2m_max,precipitation_sum&timezone=auto'
      );
      if (!response.ok) {
        throw new Error('Offline');
      }
      const data = await response.json();
      if (data && data.daily) {
        const formatted = data.daily.time.map((timeStr: string, idx: number) => ({
          date: timeStr,
          tempMax: data.daily.temperature_2m_max[idx],
          weatherCode: data.daily.weather_code[idx],
          precipitation: data.daily.precipitation_sum[idx],
        }));
        setForecasts(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setWeatherError('Weather service offline');
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherForecast();
  }, []);

  // When target date changes, reset manual override to allow auto-weather lookup
  useEffect(() => {
    setUserOverrodeWeather(false);
  }, [targetDate]);

  // Match and automatically apply weather condition based on target date
  useEffect(() => {
    if (forecasts.length === 0 || userOverrodeWeather) return;

    const matching = forecasts.find(f => f.date === targetDate);
    if (matching) {
      // Determine weather category using the exact same conditions as the display text:
      // Rainy: precipitation > 1.0mm
      // Hot: tempMax >= 31.0°C
      // Normal: otherwise
      const isRainy = matching.precipitation > 1.0;
      const isHot = matching.tempMax >= 31.0;

      if (isRainy) {
        setWeather('rainy');
      } else if (isHot) {
        setWeather('hot');
      } else {
        setWeather('normal');
      }
    }
  }, [targetDate, forecasts, userOverrodeWeather]);

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

  // Auto-set event status based on date
  useMemo(() => {
    if (targetDayOfWeekIndex === 0 || targetDayOfWeekIndex === 6) {
      setEvent('weekend');
    } else {
      setEvent('normal');
    }
  }, [targetDayOfWeekIndex]);

  // Calculations
  const calculations = useMemo(() => {
    if (entries.length === 0) {
      return {
        histAvgStick: 40,
        histAvgPot: 25,
        dayOfWeekAvgStick: 40,
        dayOfWeekAvgPot: 25,
        recent7DayAvgStick: 40,
        recent7DayAvgPot: 25,
        predictedStick: 40,
        predictedPot: 25,
        availableStick: 0,
        availablePot: 0,
        shortageStick: 40,
        shortagePot: 25,
      };
    }

    const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

    // 1. Overall Historical Averages
    const totalEntriesCount = entries.length;
    const totalStickSold = entries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const totalPotSold = entries.reduce((sum, e) => sum + (e.potSold || 0), 0);

    const histAvgStick = Math.round(totalStickSold / totalEntriesCount);
    const histAvgPot = Math.round(totalPotSold / totalEntriesCount);

    // 2. Day of Week Historical Averages
    const dayOfWeekEntries = entries.filter(e => {
      try {
        return getDay(parseISO(e.date)) === targetDayOfWeekIndex;
      } catch {
        return false;
      }
    });

    const dayOfWeekAvgStick = dayOfWeekEntries.length > 0 
      ? Math.round(dayOfWeekEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0) / dayOfWeekEntries.length)
      : histAvgStick;

    const dayOfWeekAvgPot = dayOfWeekEntries.length > 0 
      ? Math.round(dayOfWeekEntries.reduce((sum, e) => sum + (e.potSold || 0), 0) / dayOfWeekEntries.length)
      : histAvgPot;

    // 3. Recent 7-Day Velocity
    const recent7Entries = sortedEntries.slice(0, 7);
    const recent7DayAvgStick = recent7Entries.length > 0
      ? Math.round(recent7Entries.reduce((sum, e) => sum + (e.stickSold || 0), 0) / recent7Entries.length)
      : histAvgStick;

    const recent7DayAvgPot = recent7Entries.length > 0
      ? Math.round(recent7Entries.reduce((sum, e) => sum + (e.potSold || 0), 0) / recent7Entries.length)
      : histAvgPot;

    // 4. Calculate Available Outpost Stock
    const cumulativeStickSold = entries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
    const cumulativePotSold = entries.reduce((sum, e) => sum + (e.potSold || 0), 0);
    const availableStick = Math.max(0, (inventory.stickQuantity || 0) - cumulativeStickSold);
    const availablePot = Math.max(0, (inventory.potQuantity || 0) - cumulativePotSold);

    // 5. Intelligent Base Demand Estimation
    // We place 60% weight on recent 7-day velocity and 40% weight on target day-of-week average
    const baseStick = Math.round(0.6 * recent7DayAvgStick + 0.4 * dayOfWeekAvgStick);
    const basePot = Math.round(0.6 * recent7DayAvgPot + 0.4 * dayOfWeekAvgPot);

    // 6. Apply Modifiers
    // Weather: Hot (+20%), Rainy (-30%), Normal (0%)
    const weatherMod = weather === 'hot' ? 20 : weather === 'rainy' ? -30 : 0;
    // Event: Festival (+35%), Weekend (+15%), Normal (0%)
    const eventMod = event === 'festival' ? 35 : event === 'weekend' ? 15 : 0;
    
    const totalMultiplier = 1 + (weatherMod + eventMod + manualBooster) / 100;

    const predictedStick = Math.max(0, Math.round(baseStick * totalMultiplier));
    const predictedPot = Math.max(0, Math.round(basePot * totalMultiplier));

    // 7. Calculate shortages for preparation
    const shortageStick = Math.max(0, predictedStick - availableStick);
    const shortagePot = Math.max(0, predictedPot - availablePot);

    return {
      histAvgStick,
      histAvgPot,
      dayOfWeekAvgStick,
      dayOfWeekAvgPot,
      recent7DayAvgStick,
      recent7DayAvgPot,
      predictedStick,
      predictedPot,
      availableStick,
      availablePot,
      shortageStick,
      shortagePot,
    };
  }, [entries, inventory, targetDate, targetDayOfWeekIndex, weather, event, manualBooster]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return [
      {
        name: 'Stick Kulfi',
        'Historical Avg': calculations.histAvgStick,
        'Recent 7-Day': calculations.recent7DayAvgStick,
        'Current Stock': calculations.availableStick,
        'Predicted Demand': calculations.predictedStick,
      },
      {
        name: 'Pot Kulfi',
        'Historical Avg': calculations.histAvgPot,
        'Recent 7-Day': calculations.recent7DayAvgPot,
        'Current Stock': calculations.availablePot,
        'Predicted Demand': calculations.predictedPot,
      }
    ];
  }, [calculations]);

  const handleCopySummary = () => {
    const text = `📋 Namma Ooru Kulfi Outpost Planning
Target Date: ${format(parseISO(targetDate), 'EEE, dd MMM yyyy')} (${targetDayName})
Weather outlook: ${weather.toUpperCase()}
Event factor: ${event.toUpperCase()}

🍦 STICK KULFI:
- Predicted Demand: ${calculations.predictedStick} units
- Available Stock: ${calculations.availableStick} units
- Recommended Prep: ${calculations.shortageStick > 0 ? `${calculations.shortageStick} units` : 'Sufficient Stock (0 units)'}

🍯 POT KULFI:
- Predicted Demand: ${calculations.predictedPot} units
- Available Stock: ${calculations.availablePot} units
- Recommended Prep: ${calculations.shortagePot > 0 ? `${calculations.shortagePot} units` : 'Sufficient Stock (0 units)'}

Generated via Predictive Preparation Planner.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

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
                  <button 
                    onClick={fetchWeatherForecast}
                    disabled={weatherLoading}
                    className="text-[10px] text-cyan-500 hover:text-cyan-600 font-bold uppercase flex items-center gap-1 focus:outline-none disabled:opacity-50"
                    type="button"
                  >
                    <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Weather</span>
                  </button>
                </div>

                {/* Sathyamangalam Auto-Fetch Weather Widget */}
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {weather === 'rainy' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <CloudRain className="w-5 h-5 animate-bounce" />
                      </div>
                    ) : weather === 'hot' ? (
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
                      setWeather('rainy');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weather === 'rainy'
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
                      setWeather('normal');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weather === 'normal'
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
                      setWeather('hot');
                      setUserOverrodeWeather(true);
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      weather === 'hot'
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
                    onClick={() => setEvent('normal')}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      event === 'normal'
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
                    onClick={() => setEvent('weekend')}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      event === 'weekend'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <span>Weekend (+15%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvent('festival')}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] font-black uppercase transition-all ${
                      event === 'festival'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : isDark
                          ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <PartyPopper className="w-4 h-4 mb-0.5" />
                    <span>Festival (+35%)</span>
                  </button>
                </div>
              </div>

              {/* Manual Booster */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Manual Booster Adjustment
                  </Label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    manualBooster >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                  }`}>
                    {manualBooster >= 0 ? `+${manualBooster}%` : `${manualBooster}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={manualBooster}
                  onChange={(e) => setManualBooster(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                  <span>-50% (Slower)</span>
                  <span>Normal</span>
                  <span>+100% (Rush)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Analytical Summary & checklist */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Prediction Outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stick Kulfi Card */}
            <Card className={`overflow-hidden border transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' 
                : 'bg-white text-slate-800 border-slate-100 shadow-lg shadow-slate-100'
            }`}>
              <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Stick Kulfi
                </CardTitle>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${
                  calculations.shortageStick > 0 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                }`}>
                  {calculations.shortageStick > 0 ? 'Action Needed' : 'Fully Stocked'}
                </span>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${labelColor}`}>Predicted Demand</p>
                    <p className="text-3xl font-black text-cyan-500 leading-none">{calculations.predictedStick} <span className="text-xs font-bold text-slate-500">pcs</span></p>
                  </div>
                  <div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${labelColor}`}>Available Stock</p>
                    <p className="text-3xl font-black text-slate-400 leading-none">{calculations.availableStick} <span className="text-xs font-bold text-slate-500">pcs</span></p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl flex items-center justify-between border ${
                  calculations.shortageStick > 0
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Preparation Target</p>
                      <p className="text-sm font-black">
                        {calculations.shortageStick > 0 
                          ? `Prepare ${calculations.shortageStick} extra Stick Kulfis` 
                          : 'Sufficient stock available!'}
                      </p>
                    </div>
                  </div>
                  {calculations.shortageStick > 0 && (
                    <span className="text-xl font-black">+{calculations.shortageStick}</span>
                  )}
                </div>

                {/* Sub averages */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[9px] font-bold uppercase text-slate-400">
                  <div>
                    <span>7-Day Avg</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.recent7DayAvgStick} pcs</p>
                  </div>
                  <div>
                    <span>Day Avg ({targetDayName.substring(0,3)})</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.dayOfWeekAvgStick} pcs</p>
                  </div>
                  <div>
                    <span>Hist Avg</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.histAvgStick} pcs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pot Kulfi Card */}
            <Card className={`overflow-hidden border transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800' 
                : 'bg-white text-slate-800 border-slate-100 shadow-lg shadow-slate-100'
            }`}>
              <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-pink-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Pot Kulfi
                </CardTitle>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${
                  calculations.shortagePot > 0 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                }`}>
                  {calculations.shortagePot > 0 ? 'Action Needed' : 'Fully Stocked'}
                </span>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${labelColor}`}>Predicted Demand</p>
                    <p className="text-3xl font-black text-pink-500 leading-none">{calculations.predictedPot} <span className="text-xs font-bold text-slate-500">pcs</span></p>
                  </div>
                  <div>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${labelColor}`}>Available Stock</p>
                    <p className="text-3xl font-black text-slate-400 leading-none">{calculations.availablePot} <span className="text-xs font-bold text-slate-500">pcs</span></p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl flex items-center justify-between border ${
                  calculations.shortagePot > 0
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Preparation Target</p>
                      <p className="text-sm font-black">
                        {calculations.shortagePot > 0 
                          ? `Prepare ${calculations.shortagePot} extra Pot Kulfis` 
                          : 'Sufficient stock available!'}
                      </p>
                    </div>
                  </div>
                  {calculations.shortagePot > 0 && (
                    <span className="text-xl font-black">+{calculations.shortagePot}</span>
                  )}
                </div>

                {/* Sub averages */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[9px] font-bold uppercase text-slate-400">
                  <div>
                    <span>7-Day Avg</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.recent7DayAvgPot} pcs</p>
                  </div>
                  <div>
                    <span>Day Avg ({targetDayName.substring(0,3)})</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.dayOfWeekAvgPot} pcs</p>
                  </div>
                  <div>
                    <span>Hist Avg</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 mt-0.5">{calculations.histAvgPot} pcs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphical comparison bar chart */}
          <Card className={cardBg}>
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" /> Comparison Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#334155', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        border: isDark ? '1px solid #1e293b' : '1px solid #cbd5e1', 
                        borderRadius: '12px',
                        color: isDark ? '#ffffff' : '#0f172a'
                      }}
                      labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '11px', color: isDark ? '#38bdf8' : '#0891b2' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Bar dataKey="Historical Avg" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Recent 7-Day" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Current Stock" fill="#a8a29e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Predicted Demand" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Action Planner Checklist */}
          <Card className={cardBg}>
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400 flex items-center gap-2">
                <ListChecks className="w-4.5 h-4.5" /> 2. Daily Preparation Task List
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCopySummary} 
                  variant="outline" 
                  className="h-8 rounded-lg text-[10px] font-extrabold uppercase px-3 flex items-center gap-1 border-slate-350 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </Button>
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  className="h-8 rounded-lg text-[10px] font-extrabold uppercase px-3 flex items-center gap-1 border-slate-350 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outpost preparation list for target date <span className="text-slate-950 dark:text-white font-black">{format(parseISO(targetDate), 'EEE, MMM dd')}</span>. Check them off as preparation is completed.
              </p>

              <div className="space-y-3">
                {/* Stick Kulfi Prep Row */}
                <div 
                  onClick={() => setStickChecked(!stickChecked)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    stickChecked 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 opacity-80' 
                      : 'border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {stickChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Stick Kulfi Preparation</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                        {calculations.shortageStick > 0 
                          ? `Load and freeze ${calculations.shortageStick} extra sticks to reach predicted target of ${calculations.predictedStick} pcs.` 
                          : `Sufficient stock (${calculations.availableStick} available). No extra preparation required.`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-base font-black ${stickChecked ? 'line-through text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                    {calculations.shortageStick > 0 ? `${calculations.shortageStick} pcs` : '0 pcs'}
                  </span>
                </div>

                {/* Pot Kulfi Prep Row */}
                <div 
                  onClick={() => setPotChecked(!potChecked)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    potChecked 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 opacity-80' 
                      : 'border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {potChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Pot Kulfi Preparation</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                        {calculations.shortagePot > 0 
                          ? `Fill and seal ${calculations.shortagePot} extra pots to reach predicted target of ${calculations.predictedPot} pcs.` 
                          : `Sufficient stock (${calculations.availablePot} available). No extra preparation required.`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-base font-black ${potChecked ? 'line-through text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                    {calculations.shortagePot > 0 ? `${calculations.shortagePot} pcs` : '0 pcs'}
                  </span>
                </div>
              </div>

              {/* Informative advice */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex gap-3 text-cyan-600 dark:text-cyan-400">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider">Historical Trend Insight</p>
                    <p className="text-[11px] leading-relaxed font-medium">
                      Sales on <span className="font-bold">{targetDayName}s</span> at the Sathyamangalam Outpost average <span className="font-bold">{calculations.dayOfWeekAvgStick} Sticks</span> and <span className="font-bold">{calculations.dayOfWeekAvgPot} Pots</span>. Recent sales velocity indicates a {calculations.recent7DayAvgStick > calculations.histAvgStick ? 'positive upward sales trend' : 'stable demand baseline'}.
                    </p>
                  </div>
                </div>

                {/* Weather-Based Stocking Suggestion Block */}
                <div className={`p-4 rounded-xl border ${
                  weather === 'hot' 
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                    : weather === 'rainy' 
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                      : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                } flex gap-3`}>
                  <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider">Sathyamangalam Weather Stocking Advice</p>
                    <p className="text-[11px] leading-relaxed font-medium">
                      {weather === 'hot' ? (
                        <span>
                          <strong>🔥 HOT WEATHER ALERT:</strong> The forecast indicates high temperatures ({forecasts.find(f => f.date === targetDate)?.tempMax.toFixed(1) || '31+'}°C) in Sathyamangalam today. This triggers a <strong>+20% sales booster</strong>. We highly recommend <strong>loading extra stock</strong> from the central storage of at least <span className="font-black">{Math.round(calculations.predictedStick * 1.2)} Sticks</span> and <span className="font-black">{Math.round(calculations.predictedPot * 1.2)} Pots</span> to capitalize on the afternoon rush and prevent early stockouts!
                        </span>
                      ) : weather === 'rainy' ? (
                        <span>
                          <strong>🌧️ RAINY WEATHER WARNING:</strong> Precipitation is forecasted for Sathyamangalam, which reduces pedestrian footfall by <strong>-30%</strong>. We suggest <strong>holding back stock loading</strong>. Maintain a lean physical inventory at the outpost of around <span className="font-black">{calculations.predictedStick} Sticks</span> and <span className="font-black">{calculations.predictedPot} Pots</span> to avoid wastage or temperature stress on unsold stock.
                        </span>
                      ) : (
                        <span>
                          <strong>☀️ STABLE WEATHER PLAN:</strong> Moderate weather conditions are expected in Sathyamangalam. We recommend loading standard quantities to fully meet the target demand of <span className="font-black">{calculations.predictedStick} Sticks</span> and <span className="font-black">{calculations.predictedPot} Pots</span>. Ensure your starting stock is filled to this baseline.
                        </span>
                      )}
                    </p>
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
