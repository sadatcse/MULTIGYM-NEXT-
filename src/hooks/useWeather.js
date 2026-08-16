"use client";

import { useState, useEffect, useCallback } from "react";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";

const OPENWEATHER_API_KEY =
  process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
  process.env.OPENWEATHER_API_KEY ||
  "d22a57e739e0cf8a642546c153f361a9";

export default function useWeather() {
  const { currentTimeZoneObj, timeZone } = useSystemTimeZone();
  const city = currentTimeZoneObj?.city || "Dhaka";

  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("metric"); // 'metric' (°C) | 'imperial' (°F)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryCity = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${queryCity}&units=${unit}&appid=${OPENWEATHER_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.cod === 200) {
        setWeather({
          cityName: data.name || city,
          country: data.sys?.country || "BD",
          temp: Math.round(data.main?.temp ?? 28),
          feelsLike: Math.round(data.main?.feels_like ?? 30),
          tempMin: Math.round(data.main?.temp_min ?? 25),
          tempMax: Math.round(data.main?.temp_max ?? 32),
          humidity: data.main?.humidity ?? 75,
          pressure: data.main?.pressure ?? 1012,
          windSpeed: data.wind?.speed ?? 3.5,
          main: data.weather?.[0]?.main || "Clear",
          description: data.weather?.[0]?.description || "clear sky",
          icon: data.weather?.[0]?.icon || "01d",
          isFallback: false,
        });
      } else {
        // Handle activation window / key error gracefully
        console.warn("OpenWeatherMap notice:", data.message);
        setWeather({
          cityName: city,
          country: "BD",
          temp: unit === "metric" ? 29 : 84,
          feelsLike: unit === "metric" ? 31 : 88,
          tempMin: unit === "metric" ? 26 : 79,
          tempMax: unit === "metric" ? 33 : 91,
          humidity: 72,
          pressure: 1011,
          windSpeed: 4.2,
          main: "Clear",
          description: "sunny & clear",
          icon: "01d",
          isFallback: true,
          notice: data.message || "Key activating...",
        });
      }
    } catch (err) {
      console.error("Fetch weather exception:", err);
      setWeather({
        cityName: city,
        country: "BD",
        temp: unit === "metric" ? 29 : 84,
        feelsLike: unit === "metric" ? 31 : 88,
        tempMin: unit === "metric" ? 26 : 79,
        tempMax: unit === "metric" ? 33 : 91,
        humidity: 72,
        pressure: 1011,
        windSpeed: 4.2,
        main: "Clear",
        description: "sunny & clear",
        icon: "01d",
        isFallback: true,
      });
    } finally {
      setLoading(false);
    }
  }, [city, unit]);

  useEffect(() => {
    // Data fetching is an intentional effect (https://react.dev/learn/you-might-not-need-an-effect#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Auto-refresh every 10 mins
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const toggleUnit = () => {
    setUnit((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  return {
    weather,
    unit,
    city,
    loading,
    error,
    toggleUnit,
    refetch: fetchWeather,
  };
}
