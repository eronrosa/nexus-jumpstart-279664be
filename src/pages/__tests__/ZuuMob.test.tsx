import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
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
const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: "ride-123" }, error: null }),
  }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: mockInsert,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock Directions API
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
  if (url.includes("directions")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        routes: [{ distance: 5000, duration: 600, geometry: {} }]
      }),
    });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
}) as any;

describe("ZuuMob Full Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes the ride request flow", async () => {
    render(
      <BrowserRouter>
        <ZuuMob />
      </BrowserRouter>
    );

    // 1. Initial State: Should show "Para onde?"
    expect(screen.getByText(/Para onde\?/i)).toBeInTheDocument();

    // 2. Click search input
    const searchTrigger = screen.getByText(/Para onde\?/i);
    fireEvent.click(searchTrigger);

    // 3. Search for destination
    const input = screen.getByPlaceholderText(/Buscar destino\.\.\./i);
    fireEvent.change(input, { target: { value: "Palmitinho" } });

    // 4. Wait for and select suggestion
    await waitFor(() => {
      expect(screen.getByText("Palmitinho")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Palmitinho"));

    // 5. Choose ride options should appear
    await waitFor(() => {
      expect(screen.getByText(/Solicitar ZuuMob/i)).toBeInTheDocument();
    });

    // 6. Click "Solicitar ZuuMob"
    const requestButton = screen.getByText(/Solicitar ZuuMob/i);
    fireEvent.click(requestButton);

    // 7. Should enter searching state
    await waitFor(() => {
      expect(screen.getByText(/Procurando seu motorista\.\.\./i)).toBeInTheDocument();
    });

    // 8. Wait for mock driver acceptance (this happens after 5s + random in the code)
    // For testing, we might want to speed up timers
    vi.useFakeTimers();
    // Advance timers to trigger driver found
    vi.advanceTimersByTime(10000);

    // 9. Should show driver info
    // (Note: in the actual component, this state transition is triggered by a setTimeout)
    // After re-rendering with fake timers
    await waitFor(() => {
      expect(screen.getByText(/Motorista a caminho/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
