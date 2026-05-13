import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAccountStatus } from "@/hooks/useAccountStatus";

type ConnectionItem = {
  id: string;
  label: string;
  phone_number: string;
};

type PhoneContextValue = {
  connections: ConnectionItem[];
  selectedId: string | null;
  selectedConnection: ConnectionItem | null;
  setSelectedId: (id: string) => void;
  loading: boolean;
};

const PhoneContext = createContext<PhoneContextValue>({
  connections: [],
  selectedId: null,
  selectedConnection: null,
  setSelectedId: () => {},
  loading: true,
});

const LS_KEY = "replora_selected_phone_id";

export function PhoneProvider({ children }: { children: ReactNode }) {
  const { agencyId, loading: accountLoading } = useAccountStatus();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountLoading) return;
    if (!agencyId) { setLoading(false); return; }

    const fetch = async () => {
      let list: ConnectionItem[] = [];
      const { data, error } = await supabase
        .from("connected_phone_numbers")
        .select("id, label, phone_number")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (!error && data) {
        list = data as ConnectionItem[];
      } else {
        const { data: fallback } = await supabase
          .from("connected_phone_numbers")
          .select("id, label, phone_number")
          .eq("agency_id", agencyId)
          .order("created_at", { ascending: true });
        list = (fallback ?? []) as ConnectionItem[];
      }

      setConnections(list);

      const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      if (saved && list.some((c) => c.id === saved)) {
        setSelectedIdState(saved);
      } else if (list.length > 0) {
        setSelectedIdState(list[0].id);
        if (typeof window !== "undefined") localStorage.setItem(LS_KEY, list[0].id);
      } else {
        setSelectedIdState(null);
      }

      setLoading(false);
    };

    fetch();
  }, [agencyId, accountLoading]);

  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  };

  const selectedConnection = connections.find((c) => c.id === selectedId) ?? null;

  return (
    <PhoneContext.Provider value={{ connections, selectedId, selectedConnection, setSelectedId, loading }}>
      {children}
    </PhoneContext.Provider>
  );
}

export function usePhoneContext() {
  return useContext(PhoneContext);
}
