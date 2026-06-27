import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { usePhoneContext } from "@/contexts/PhoneContext";

// ── Types ──────────────────────────────────────────────
interface ActivityEvent {
    id: string;
    event_type: string;
    phone_number: string | null;
    meta: Record<string, string>;
    created_at: string;
}

// ── Stage label helper ─────────────────────────────────
function stageLabel(s: string): string {
    const map: Record<string, string> = {
        new_lead: "New Lead",
        qualified: "Qualified",
        proposal: "Proposal",
        won: "Won",
        lost: "Lost",
    };
    return map[s] ?? s;
}

// ── Event config ───────────────────────────────────────
interface EventCfg {
    icon: string;
    dot: string;
    label: (meta: Record<string, string>, phone: string | null) => string;
}

function getConfig(
    event_type: string,
    meta: Record<string, string>,
    phone: string | null
): { icon: string; dot: string; labelText: string } {
    switch (event_type) {
        case "message_received":
            return {
                icon: "💬",
                dot: "#0084ff",
                labelText: `${phone ?? "Contact"} sent a message${meta.preview ? `: "${meta.preview}"` : ""}`,
            };
        case "ai_replied":
            return {
                icon: "🤖",
                dot: "#00c853",
                labelText: `AI replied to ${phone ?? "contact"}${meta.preview ? `: "${meta.preview}"` : ""}`,
            };
        case "message_sent":
            return {
                icon: "✉️",
                dot: "#a855f7",
                labelText: `You replied to ${phone ?? "contact"}`,
            };
        case "lead_tagged":
            return {
                icon: meta.label === "hot" ? "🔥" : "🌡️",
                dot: meta.label === "hot" ? "#ef4444" : "#f59e0b",
                labelText: `${phone ?? "Contact"} tagged as ${(meta.label ?? "").toUpperCase()}`,
            };
        case "conversation_open":
            return {
                icon: "🟢",
                dot: "#00c853",
                labelText: `New conversation opened with ${phone ?? "contact"}`,
            };
        case "conversation_closed":
            return {
                icon: "🔒",
                dot: "#6b7280",
                labelText: `Conversation with ${phone ?? "contact"} closed`,
            };
        case "human_takeover":
            return {
                icon: "👤",
                dot: "#f59e0b",
                labelText: `Human takeover activated for ${phone ?? "contact"}`,
            };
        case "deal_created":
            return {
                icon: "💼",
                dot: "#0084ff",
                labelText: `Deal created: "${meta.title ?? "Untitled"}"${meta.value ? ` — ₹${meta.value}` : ""}`,
            };
        case "deal_moved":
            return {
                icon: "📊",
                dot: "#a855f7",
                labelText: `Deal "${meta.title ?? ""}" moved: ${stageLabel(meta.from_stage)} → ${stageLabel(meta.to_stage)}`,
            };
        default:
            return {
                icon: "📌",
                dot: "#6b7280",
                labelText: event_type,
            };
    }
}

// ── Time ago helper ────────────────────────────────────
function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Main Component ─────────────────────────────────────
export function ActivityFeed({ maxHeight = 420 }: { maxHeight?: number }) {
    const { selectedId } = usePhoneContext();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchEvents = async () => {
        setLoading(true);
        let query = supabase
            .from("activity_log")
            .select("id,event_type,phone_number,meta,created_at")
            .order("created_at", { ascending: false })
            .limit(40);

        if (selectedId) {
            query = query.eq("connection_id", selectedId);
        }

        const { data } = await query;
        setEvents((data ?? []) as ActivityEvent[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [selectedId]);

    // Realtime — new events appear instantly
    useEffect(() => {
        const channel = supabase
            .channel("activity_feed_realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "activity_log" },
                (payload) => {
                    const newEvent = payload.new as ActivityEvent;
                    setEvents((prev) =>
                        [newEvent, ...prev.filter((e) => e.id !== newEvent.id)].slice(0, 40)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div
            style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            height: 34,
                            width: 34,
                            borderRadius: 10,
                            background: "rgba(0,132,255,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                        }}
                    >
                        ⚡
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                            Activity Feed
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                            Live events across all conversations
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchEvents}
                    title="Refresh"
                    style={{
                        height: 30,
                        width: 30,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                    ↻
                </button>
            </div>

            {/* Feed */}
            <div
                ref={scrollRef}
                style={{
                    maxHeight,
                    overflowY: "auto",
                    padding: "10px 0",
                    scrollbarWidth: "none",
                }}
            >
                {loading ? (
                    /* Skeleton */
                    <div style={{ padding: "0 18px" }}>
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: "10px 0",
                                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.06)",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            height: 11,
                                            width: "70%",
                                            borderRadius: 4,
                                            background: "rgba(255,255,255,0.06)",
                                            marginBottom: 6,
                                        }}
                                    />
                                    <div
                                        style={{
                                            height: 9,
                                            width: "30%",
                                            borderRadius: 4,
                                            background: "rgba(255,255,255,0.04)",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "32px 0",
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 13,
                        }}
                    >
                        No activity yet — send a WhatsApp message to get started
                    </div>
                ) : (
                    <div style={{ padding: "0 18px" }}>
                        {events.map((ev, idx) => {
                            const meta = (ev.meta ?? {}) as Record<string, string>;
                            const { icon, dot, labelText } = getConfig(ev.event_type, meta, ev.phone_number);

                            return (
                                <div
                                    key={ev.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 12,
                                        padding: "9px 0",
                                        borderBottom:
                                            idx < events.length - 1
                                                ? "1px solid rgba(255,255,255,0.04)"
                                                : "none",
                                        animation: "fadeSlideIn 0.25s ease",
                                    }}
                                >
                                    {/* Icon circle */}
                                    <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                                        <div
                                            style={{
                                                height: 28,
                                                width: 28,
                                                borderRadius: "50%",
                                                background: `${dot}18`,
                                                border: `1px solid ${dot}30`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 13,
                                            }}
                                        >
                                            {icon}
                                        </div>
                                        {/* Connector line */}
                                        {idx < events.length - 1 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: "50%",
                                                    top: 30,
                                                    width: 1,
                                                    height: 16,
                                                    background: "rgba(255,255,255,0.06)",
                                                    transform: "translateX(-50%)",
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 12.5,
                                                color: "rgba(255,255,255,0.78)",
                                                lineHeight: 1.45,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            title={labelText}
                                        >
                                            {labelText}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10.5,
                                                color: "rgba(255,255,255,0.25)",
                                                marginTop: 2,
                                            }}
                                        >
                                            {timeAgo(ev.created_at)}
                                            {ev.phone_number && (
                                                <span style={{ marginLeft: 6, color: "rgba(255,255,255,0.18)" }}>
                                                    · {ev.phone_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}