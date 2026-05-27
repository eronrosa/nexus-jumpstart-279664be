import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ZuuMob from "../ZuuMob";
import { BrowserRouter } from "react-router-dom";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "test@example.com" },
    profile: { display_name: "Test User", avatar_url: "" },
  }),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "ride-123", status: "searching" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({ 
        eq: vi.fn().mockResolvedValue({ error: null }) 
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock Mapbox and fetch
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("geocoding")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        features: [
          { id: "1", text: "Palmitinho", place_name: "Palmitinho, RS, Brasil", center: [-53.4146, -27.2831] }
        ]
      }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ routes: [{ distance: 5000, duration: 600, geometry: { type: "LineString", coordinates: [] } }] }),
  });
}) as any;

describe("ZuuMob Full Flow", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_MAPBOX_TOKEN", "mock-token");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("completes the ride request flow", async () => {
  }, 15000);
    render(
      <BrowserRouter>
        <ZuuMob />
      </BrowserRouter>
    );

    // Initial load: Wait for geolocation mock to trigger (it's immediate in setup.ts but let's be sure)
    await waitFor(() => {
      expect(screen.getByText(/Para onde\?/i)).toBeInTheDocument();
    });

    // 1. Click search trigger
    fireEvent.click(screen.getByText(/Para onde\?/i));

    // 2. Search for destination
    const input = await screen.findByPlaceholderText(/Buscar destino\.\.\./i);
    fireEvent.change(input, { target: { value: "Palmitinho" } });

    // 3. Wait for suggestion and click it
    const suggestion = await screen.findByText("Palmitinho");
    fireEvent.click(suggestion);

    // 4. Ride options should appear
    const requestBtn = await screen.findByText(/Solicitar ZuuMob/i);
    expect(requestBtn).toBeInTheDocument();

    // 5. Click "Solicitar ZuuMob"
    fireEvent.click(requestBtn);

    // 6. Should enter searching state
    await waitFor(() => {
      expect(screen.getByText(/Procurando seu motorista\.\.\./i)).toBeInTheDocument();
    });

    // 7. Advance timers to find driver
    vi.advanceTimersByTime(10000);

    // 8. Driver info should appear
    await waitFor(() => {
      expect(screen.getByText(/Motorista a caminho/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByText(/Carlos Silva/i)).toBeInTheDocument();
  });
});
