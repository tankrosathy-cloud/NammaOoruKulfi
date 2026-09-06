import { useState, useEffect } from 'react';

interface DailyForecast {
  date: string;
  tempMax: number;
  weatherCode: number;
  precipitation: number;
}

const WEATHER_CACHE_KEY = 'weather_forecast_cache';

export function useWeather() {
  const [forecasts, setForecasts] = useState<DailyForecast[]>(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeatherForecast = async () => {
    // If browser is explicitly offline, don't attempt network fetch
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=11.5014&longitude=77.2444&daily=weather_code,temperature_2m_max,precipitation_sum&timezone=auto',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Soft fallback to cached data without throwing
        return;
      }
      const data = await response.json();
      if (data && data.daily && Array.isArray(data.daily.time)) {
        const formatted = data.daily.time.map((timeStr: string, idx: number) => ({
          date: timeStr,
          tempMax: data.daily.temperature_2m_max?.[idx] ?? 30,
          weatherCode: data.daily.weather_code?.[idx] ?? 0,
          precipitation: data.daily.precipitation_sum?.[idx] ?? 0,
        }));
        setForecasts(formatted);
        try {
          localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(formatted));
        } catch {
          // ignore localStorage issues
        }
      }
    } catch {
      // Graceful silent fallback to cached forecasts
      setWeatherError(null);
    } finally {
      clearTimeout(timeoutId);
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherForecast();
  }, []);

  const getWeatherForDate = (targetDate: string): 'normal' | 'hot' | 'rainy' => {
    const matching = forecasts.find(f => f.date === targetDate);
    if (matching) {
      const isRainy = matching.precipitation > 1.0;
      const isHot = matching.tempMax >= 31.0;
      if (isRainy) return 'rainy';
      if (isHot) return 'hot';
    }
    return 'normal';
  };

  return { forecasts, weatherLoading, weatherError, getWeatherForDate };
}
