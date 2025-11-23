"use client";

import { Check } from "lucide-react";

interface AvailabilityMatrixProps {
  availability: any; // Type depends on API response structure
}

const COUNTRIES = [
  { code: "us", name: "US", flag: "🇺🇸" },
  { code: "gb", name: "UK", flag: "🇬🇧" },
  { code: "ca", name: "CA", flag: "🇨🇦" },
  { code: "au", name: "AU", flag: "🇦🇺" },
  { code: "in", name: "IN", flag: "🇮🇳" },
];

const PLATFORMS = [
  { id: "netflix", name: "Netflix" },
  { id: "prime", name: "Prime" },
  { id: "disney", name: "Disney+" },
  { id: "hbo", name: "Max" },
  { id: "apple", name: "Apple TV" },
];

export function AvailabilityMatrix({ availability }: AvailabilityMatrixProps) {
  if (!availability) {
    return <div className="text-sm text-muted-foreground">No streaming data available.</div>;
  }

  // Helper to check if a platform is available in a country
  const isAvailable = (platformId: string, countryCode: string) => {
    const countryData = availability[countryCode];
    if (!countryData) return false;
    
    // The API structure varies, but usually it's a list of services
    // We'll assume a simplified structure for now or adapt to the actual API
    // Real API usually returns { us: { netflix: [...], ... } } or similar
    
    // Check if the platform exists in the country's options
    // This logic depends heavily on the exact API response shape
    // For 'streaming-availability' API v2, it's often: result.streamingInfo.us.netflix
    
    const services = countryData; // Assuming countryData is the object of services
    return !!services?.[platformId];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr>
            <th className="p-2"></th>
            {COUNTRIES.map((c) => (
              <th key={c.code} className="p-2 text-center" title={c.name}>
                {c.flag}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLATFORMS.map((p) => (
            <tr key={p.id} className="border-b border-border/50 last:border-0">
              <td className="p-2 font-medium">{p.name}</td>
              {COUNTRIES.map((c) => {
                const available = isAvailable(p.id, c.code);
                return (
                  <td key={c.code} className="p-2 text-center">
                    {available ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground/20 mx-auto block w-4 h-4">•</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
