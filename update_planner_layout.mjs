import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const replacement = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className={isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}>
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
                    className={\`w-full h-11 px-3 rounded-xl border text-sm font-bold uppercase \${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500'
                    }\`}
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
                    className={\`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all \${
                      weatherCondition === 'normal'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }\`}
                  >
                    <CloudSun className="w-4 h-4" /> Normal
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('hot'); setUserOverrodeWeather(true); }}
                    className={\`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all \${
                      weatherCondition === 'hot'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }\`}
                  >
                    <Sun className="w-4 h-4" /> Hot (+15%)
                  </button>
                  <button
                    onClick={() => { setWeatherCondition('rain'); setUserOverrodeWeather(true); }}
                    className={\`p-2 flex flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all \${
                      weatherCondition === 'rain'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }\`}
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
                  className={\`w-full h-11 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider \${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-pink-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-pink-500'
                  }\`}
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
                  className={\`w-full h-11 px-4 flex items-center justify-between rounded-xl border text-xs font-black uppercase tracking-wider transition-all \${
                    isHoliday
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : isDark
                        ? 'border-slate-800 hover:bg-slate-900/40 text-slate-400'
                        : 'border-slate-300 hover:bg-slate-100 text-slate-700 bg-white'
                  }\`}
                >
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-4 h-4 mb-0.5" />
                    <span>Public Holiday / Festival</span>
                  </div>
                  {isHoliday ? (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white">+30%</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">+30% Boost</span>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Analytical Summary */}
        <div className="space-y-6 lg:col-span-2">`;

content = content.replace(/<div className="space-y-6">\s*\{\/\* Analytical Summary \*\/\}\s*<div className="space-y-6">/, replacement);

fs.writeFileSync('src/pages/Planner.tsx', content);
