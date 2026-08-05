import { useState, useEffect } from 'react';

interface DailyForecast {
  date: string;
  tempMax: number;
  weatherCode: number;
  precipitation: number;
}

export function useWeather() {
  const [forecasts, setForecasts] = useState<DailyForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

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
    } catch (err) {
      console.error(err);
      setWeatherError('Failed to fetch weather');
    } finally {
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
