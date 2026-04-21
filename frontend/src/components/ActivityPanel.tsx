import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Activity, History } from "lucide-react";
import {
  subscribeEvents,
  listRuns,
  getRunEvents,
  type LiveEvent,
  type RunSummary,
  type StoredEvent,
} from "../api/events";

const panelStyle: CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#ffffff",
  fontSize: 12.5,
};

const tabsBar: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #e4e4e7",
  paddingLeft: 8,
  paddingRight: 8,
  gap: 2,
  flexShrink: 0,
};

const tabStyle = (active: boolean): CSSProperties => ({
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: active ? "#09090b" : "#71717a",
  borderBottom: active ? "2px solid #09090b" : "2px solid transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  backgroundColor: "transparent",
  border: "none",
  letterSpacing: "-0.2px",
});

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const emptyStyle: CSSProperties = {
  padding: "20px 12px",
  fontSize: 12.5,
  color: "#a1a1aa",
  textAlign: "center",
};

const KIND_COLORS: Record<LiveEvent["kind"], { bg: string; dot: string; text: string }> = {
  tick: { bg: "#f4f4f5", dot: "#a1a1aa", text: "#3f3f46" },
  decision: { bg: "#eff6ff", dot: "#2563eb", text: "#1e40af" },
  error: { bg: "#fef2f2", dot: "#dc2626", text: "#991b1b" },
  info: { bg: "#fafafa", dot: "#52525b", text: "#3f3f46" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

function EventRow({ e }: { e: LiveEvent }) {
  const colors = KIND_COLORS[e.kind];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 6,
        backgroundColor: colors.bg,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: colors.dot,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 10,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              color: "#a1a1aa",
              flexShrink: 0,
            }}
          >
            {formatTime(e.ts)}
          </span>
          <span
            style={{
              fontSize: 12.5,
              color: colors.text,
              fontWeight: 500,
              wordBreak: "break-word",
            }}
          >
            {e.message}
          </span>
        </div>
      </div>
    </div>
  );
}

function RunRow({
  run,
  active,
  onClick,
}: {
  run: RunSummary;
  active: boolean;
  onClick: () => void;
}) {
  const statusColor =
    run.status === "running"
      ? "#2563eb"
      : run.status === "error"
      ? "#dc2626"
      : "#52525b";
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: 6,
        border: `1px solid ${active ? "#09090b" : "#e4e4e7"}`,
        backgroundColor: active ? "#fafafa" : "#ffffff",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#09090b" }}>
          {formatTime(run.startedAt)}
        </span>
        <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
          {run.status}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#71717a", display: "flex", gap: 8 }}>
        <span>{run.eventCount} events</span>
        {run.stoppedAt && <span>· {Math.round((run.stoppedAt - run.startedAt) / 1000)}s</span>}
      </div>
      {run.errorMessage && (
        <div
          style={{
            fontSize: 11,
            color: "#991b1b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={run.errorMessage}
        >
          {run.errorMessage}
        </div>
      )}
    </div>
  );
}

export default function ActivityPanel({ workflowId }: { workflowId: string | null }) {
  const [tab, setTab] = useState<"live" | "history">("live");
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runEvents, setRunEvents] = useState<StoredEvent[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    setLiveEvents([]);
    setRuns([]);
    setSelectedRunId(null);
    setRunEvents([]);
    if (!workflowId) return;
    const unsub = subscribeEvents(workflowId, (e) => {
      setLiveEvents((prev) => {
        const next = [...prev, e];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    });
    return () => unsub();
  }, [workflowId]);

  useEffect(() => {
    if (tab !== "live" || pausedRef.current) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveEvents, tab]);

  const refreshRuns = useCallback(async () => {
    if (!workflowId) return;
    try {
      const rs = await listRuns(workflowId);
      setRuns(rs);
    } catch {
      /* ignore */
    }
  }, [workflowId]);

  useEffect(() => {
    if (tab === "history") refreshRuns();
  }, [tab, refreshRuns]);

  useEffect(() => {
    if (!selectedRunId) {
      setRunEvents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const events = await getRunEvents(selectedRunId);
        if (!cancelled) setRunEvents(events);
      } catch {
        if (!cancelled) setRunEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  const historyLiveShape = useMemo<LiveEvent[]>(
    () =>
      runEvents.map((e) => ({
        ts: e.ts,
        kind: e.kind,
        nodeId: e.nodeId ?? undefined,
        message: e.message,
        data: e.data,
      })),
    [runEvents]
  );

  const body = !workflowId ? (
    <div style={emptyStyle}>Save a workflow to see activity.</div>
  ) : tab === "live" ? (
    liveEvents.length === 0 ? (
      <div style={emptyStyle}>Waiting for events…</div>
    ) : (
      <div
        ref={listRef}
        style={listStyle}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        {liveEvents.map((e, i) => (
          <EventRow e={e} key={`${e.ts}-${i}`} />
        ))}
      </div>
    )
  ) : (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div
        style={{
          width: 180,
          borderRight: "1px solid #e4e4e7",
          overflowY: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {runs.length === 0 ? (
          <div style={emptyStyle}>No runs yet.</div>
        ) : (
          runs.map((r) => (
            <RunRow
              key={r.id}
              run={r}
              active={selectedRunId === r.id}
              onClick={() => setSelectedRunId(r.id)}
            />
          ))
        )}
      </div>
      <div style={{ ...listStyle, padding: "8px 12px" }}>
        {!selectedRunId ? (
          <div style={emptyStyle}>Pick a run to inspect its events.</div>
        ) : historyLiveShape.length === 0 ? (
          <div style={emptyStyle}>No events in this run.</div>
        ) : (
          historyLiveShape.map((e, i) => <EventRow e={e} key={`${e.ts}-${i}`} />)
        )}
      </div>
    </div>
  );

  return (
    <div style={panelStyle}>
      <div style={tabsBar}>
        <button style={tabStyle(tab === "live")} onClick={() => setTab("live")}>
          <Activity size={12} />
          Live
        </button>
        <button style={tabStyle(tab === "history")} onClick={() => setTab("history")}>
          <History size={12} />
          History
        </button>
      </div>
      {body}
    </div>
  );
}
