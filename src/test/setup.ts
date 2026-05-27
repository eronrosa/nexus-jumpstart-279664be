import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Mapbox GL
vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getSource: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
    })),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock Geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) => success({
    coords: {
      latitude: -27.2831,
      longitude: -53.4146,
    },
  })),
  watchPosition: vi.fn(),
};
(globalThis.navigator as any).geolocation = mockGeolocation;

// Mock fetch
globalThis.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ features: [] }),
  })
) as any;
