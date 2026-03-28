import { useEffect, useMemo, useState } from "react";
import { sriLankaLocations } from "./sriLankaLocations";

export type LocationSuggestion = {
  place_id: string;
  primaryText: string;
  secondaryText: string;
  latitude?: number;
  longitude?: number;
  source: "google" | "local";
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

function toLocalSuggestions(query: string) {
  const lower = query.toLowerCase();
  return sriLankaLocations
    .filter(
      (item) => item.primaryText.toLowerCase().includes(lower) || item.secondaryText.toLowerCase().includes(lower)
    )
    .slice(0, 8)
    .map<LocationSuggestion>((item) => ({
      place_id: item.place_id,
      primaryText: item.primaryText,
      secondaryText: item.secondaryText,
      latitude: item.latitude,
      longitude: item.longitude,
      source: "local",
    }));
}

async function fetchGoogleAutocomplete(query: string, apiKey: string): Promise<LocationSuggestion[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", query);
  url.searchParams.set("components", "country:lk");
  url.searchParams.set("types", "geocode");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as {
    status?: string;
    predictions?: Array<{
      place_id: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
      description?: string;
    }>;
  };

  if (!response.ok || data.status === "REQUEST_DENIED") {
    throw new Error("Google Places autocomplete request failed");
  }

  return (data.predictions ?? []).slice(0, 8).map<LocationSuggestion>((item) => ({
    place_id: item.place_id,
    primaryText: item.structured_formatting?.main_text ?? item.description ?? "",
    secondaryText: item.structured_formatting?.secondary_text ?? "",
    source: "google",
  }));
}

export async function resolveSuggestionDetails(suggestion: LocationSuggestion): Promise<LocationSuggestion> {
  if (suggestion.latitude !== undefined && suggestion.longitude !== undefined) {
    return suggestion;
  }

  if (suggestion.source !== "google") {
    return suggestion;
  }

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return suggestion;

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", suggestion.place_id);
  url.searchParams.set("fields", "geometry/location,place_id,name,formatted_address");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as {
    status?: string;
    result?: {
      geometry?: { location?: { lat?: number; lng?: number } };
      name?: string;
      formatted_address?: string;
      place_id?: string;
    };
  };

  if (!response.ok || data.status === "REQUEST_DENIED" || !data.result) {
    return suggestion;
  }

  return {
    ...suggestion,
    place_id: data.result.place_id ?? suggestion.place_id,
    primaryText: data.result.name ?? suggestion.primaryText,
    secondaryText: data.result.formatted_address ?? suggestion.secondaryText,
    latitude: data.result.geometry?.location?.lat,
    longitude: data.result.geometry?.location?.lng,
  };
}

export function useLocationSuggestions(query: string, countryCode = "lk") {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = query.trim();
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  const canUseGoogle = Boolean(apiKey && countryCode.toLowerCase() === "lk");

  useEffect(() => {
    if (normalized.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const next = canUseGoogle
          ? await fetchGoogleAutocomplete(normalized, String(apiKey))
          : toLocalSuggestions(normalized);
        if (!cancelled) {
          setSuggestions(next);
        }
      } catch {
        if (!cancelled) {
          const fallback = toLocalSuggestions(normalized);
          setSuggestions(fallback);
          setError(fallback.length ? null : "No suggestions available right now");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [normalized, canUseGoogle, apiKey, countryCode]);

  return useMemo(
    () => ({
      suggestions,
      isLoading,
      error,
    }),
    [suggestions, isLoading, error]
  );
}
