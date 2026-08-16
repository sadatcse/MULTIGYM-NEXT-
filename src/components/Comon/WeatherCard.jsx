"use client";

import React from "react";
import useWeather from "@/hooks/useWeather";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import {
  FiSun,
  FiCloud,
  FiCloudRain,
  FiWind,
  FiDroplet,
  FiCompass,
  FiRefreshCw,
  FiMapPin,
  FiClock,
  FiThermometer,
  FiZap,
} from "react-icons/fi";

const getWeatherIcon = (mainCondition) => {
  const cond = (mainCondition || "").toLowerCase();
  if (cond.includes("rain") || cond.includes("drizzle")) {
    return <FiCloudRain className="text-2xl text-sky-400 animate-bounce" />;
  }
  if (cond.includes("cloud")) {
    return <FiCloud className="text-2xl text-amber-300 dark:text-sky-300" />;
  }
  if (cond.includes("thunder") || cond.includes("storm")) {
    return <FiZap className="text-2xl text-yellow-400 animate-pulse" />;
  }
  if (cond.includes("wind") || cond.includes("mist")) {
    return <FiWind className="text-2xl text-teal-300" />;
  }
  return <FiSun className="text-2xl text-amber-400 animate-spin-slow" />;
};

export default function WeatherCard() {
  const { weather, unit, loading, toggleUnit, refetch } = useWeather();
  const { formatDateTime } = useSystemTimeZone();

  if (loading && !weather) {
    return (
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md animate-pulse space-y-3">
        <div className="h-4 bg-brand-beige/40 dark:bg-brand-dark-grey/40 rounded-xl w-1/3" />
        <div className="h-10 bg-brand-beige/40 dark:bg-brand-dark-grey/40 rounded-xl w-full" />
      </div>
    );
  }

  const isCelsius = unit === "metric";
  const tempDegree = isCelsius ? "°C" : "°F";
  const windUnit = isCelsius ? "m/s" : "mph";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight border border-brand-gold/30 shadow-xl p-4 sm:p-5 text-white font-sans group">
      {/* Background Glow Orb */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-gold/10 rounded-full blur-2xl group-hover:bg-brand-gold/20 transition-all pointer-events-none" />

      {/* Compact Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-gold/30">
            <FiMapPin />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-1 text-white">
              <span>{weather?.cityName || "Dhaka"}</span>
              <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-1.5 py-0.2 rounded-md border border-brand-gold/20 font-mono">
                {weather?.country || "BD"}
              </span>
            </h3>
            <p className="text-[10px] text-brand-gold-light flex items-center gap-1 mt-0.5">
              <FiClock className="text-[10px] shrink-0" />
              <span>{formatDateTime(new Date())}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* C / F Unit Toggle */}
          <button
            type="button"
            onClick={toggleUnit}
            title={`Switch to ${isCelsius ? "Fahrenheit (°F)" : "Celsius (°C)"}`}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-brand-gold hover:text-brand-midnight font-mono text-[10px] font-black border border-white/20 transition-all cursor-pointer"
          >
            {isCelsius ? "°C" : "°F"}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            title="Refresh Weather"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw className={`text-[10px] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Temperature Section */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 border border-white/10 shadow-inner">
            {getWeatherIcon(weather?.main)}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {weather?.temp ?? "--"}
              </span>
              <span className="text-lg font-extrabold text-brand-gold">{tempDegree}</span>
            </div>
            <p className="text-[11px] font-bold capitalize text-brand-gold-light tracking-wide">
              {weather?.description || "Clear Sky"}
            </p>
          </div>
        </div>

        <div className="text-right space-y-0.5 font-mono text-[11px]">
          <div className="text-brand-gold-light flex items-center justify-end gap-1 font-semibold">
            <FiThermometer className="text-brand-gold shrink-0" />
            <span>Feels: <strong className="text-white">{weather?.feelsLike}{tempDegree}</strong></span>
          </div>
          <div className="text-brand-gold-light text-[10px]">
            H:{weather?.tempMax}{tempDegree} L:{weather?.tempMin}{tempDegree}
          </div>
        </div>
      </div>

      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-3 gap-1.5 pt-3 mt-3 border-t border-white/10 text-center">
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <span className="text-[9px] uppercase tracking-wider text-brand-gold-light font-extrabold block mb-0.5 flex items-center justify-center gap-1">
            <FiDroplet className="text-sky-400 text-[10px]" /> Humidity
          </span>
          <span className="text-[11px] font-black font-mono text-white">
            {weather?.humidity ?? 70}%
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <span className="text-[9px] uppercase tracking-wider text-brand-gold-light font-extrabold block mb-1 flex items-center justify-center gap-1">
            <FiWind className="text-teal-300 text-[10px]" /> Wind
          </span>
          <span className="text-[11px] font-black font-mono text-white">
            {weather?.windSpeed ?? 0} {windUnit}
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <span className="text-[9px] uppercase tracking-wider text-brand-gold-light font-extrabold block mb-1 flex items-center justify-center gap-1">
            <FiCompass className="text-amber-400 text-[10px]" /> Pressure
          </span>
          <span className="text-[11px] font-black font-mono text-white">
            {weather?.pressure ?? 1013} hPa
          </span>
        </div>
      </div>
    </div>
  );
}
