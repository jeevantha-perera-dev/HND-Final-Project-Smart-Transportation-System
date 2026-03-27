import { useState } from "react";
import { searchBusRoutes } from "../services/locationService";
import { BusResult, Place } from "../types/bus";

export const useBusSearch = () => {
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toPlace, setToPlace] = useState<Place | null>(null);
  const [results, setResults] = useState<BusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (override?: { from?: Place | null; to?: Place | null }) => {
    const origin = override?.from ?? fromPlace;
    const dest = override?.to ?? toPlace;
    if (!origin || !dest) return { data: [] as BusResult[], error: "Please select both origin and destination." };
    setLoading(true);
    setRetrying(false);
    setError(null);
    try {
      const data = await searchBusRoutes(origin, dest);
      setResults(data);
      return { data, error: null as string | null };
    } catch {
      setRetrying(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        const retryData = await searchBusRoutes(origin, dest);
        setResults(retryData);
        return { data: retryData, error: null as string | null };
      } catch {
        const nextError = "Failed to fetch bus data. Please try again.";
        setError(nextError);
        return { data: [] as BusResult[], error: nextError };
      } finally {
        setRetrying(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    fromPlace,
    setFromPlace,
    toPlace,
    setToPlace,
    results,
    loading,
    retrying,
    error,
    search,
  };
};
