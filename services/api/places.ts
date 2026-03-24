import { apiRequest } from "./client";

type ReverseGeocodeResult = {
  place_id: string;
  formatted_address: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  types?: string[];
};

type ReverseGeocodeResponse = {
  results: ReverseGeocodeResult[];
  status: string;
};

export async function reverseGeocode(latitude: number, longitude: number) {
  return apiRequest<ReverseGeocodeResponse>("/places/reverse-geocode", {
    method: "POST",
    body: { latitude, longitude },
  });
}
