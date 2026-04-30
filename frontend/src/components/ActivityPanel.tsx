import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Activity, History, Radio, Inbox } from "lucide-react";
import {
  subscribeEvents,
  listRuns,
  getRunEvents,
  type LiveEvent,
  type RunSummary,
  type StoredEvent,
} from "../api/events";
import Tabs from "../ui/Tabs";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

const panelStyle: CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "var(--bg-panel)",
  fontSize: 12.5,
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "10px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

type Kind = LiveEvent["kind"];

const KIND_META: Record<
  Kind,
  { tone: "neutral" | "violet" | "mint" | "amber" | "red" | "blue"; border: string }
> = {
  tick: { tone: "neutral", border: "var(--text-muted)" },
  decision: { tone: "blue", border: "var(--info)" },
  error: { tone: "red", border: "var(--danger)" },
  info: { tone: "violet", border: "var(--accent)" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

function isWouldTrade(e: LiveEvent): boolean {
  if (e.kind !== "decision") return false;
  if (e.data && (e.data as Record<string, unknown>).wouldTrade) return true;
  return /would execute|spread detected/i.test(e.message);
}

function EventRow({ e }: { e: LiveEvent }) {
  const meta = KIND_META[e.kind];
  const wouldTrade = isWouldTrade(e);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "8px 10px",
        borderRadius: "var(--radius-sm)",
        background: wouldTrade ? "var(--accent-soft)" : "var(--bg-sunken)",
        borderLeft: `2px solid ${
          wouldTrade ? "var(--accent)" : meta.border
        }`,
      }}
    >
      <span
        className="fp-mono"
        style={{
          fontSize: 10.5,
          color: "var(--text-dim)",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {formatTime(e.ts)}
      </span>
      <Badge tone={meta.tone} style={{ fontSize: 9.5, height: 18, padding: "0 6px" }}>
        {e.kind}
      </Badge>
      {wouldTrade && (
        <Badge
          tone="violet"
          style={{ fontSize: 9.5, height: 18, padding: "0 6px" }}
        >
          would trade
        </Badge>
      )}
      <span
        style={{
          fontSize: 12.5,
          color: "var(--text)",
          fontWeight: wouldTrade ? 600 : 450,
          wordBreak: "break-word",
          flex: 1,
          minWidth: 0,
          lineHeight: 1.5,
        }}
      >
        {e.message}
      </span>
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
  const tone =
    run.status === "running"
      ? "violet"
      : run.status === "error"
      ? "red"
      : "neutral";
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = "var(--border)";
      }}
      style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active ? "var(--accent-soft)" : "var(--bg-panel)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition:
          "border-color var(--dur-fast), background-color var(--dur-fast)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span
          className="fp-mono"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)" }}
        >
          {formatTime(run.startedAt)}
        </span>
        <Badge tone={tone as "violet" | "red" | "neutral"}>{run.status}</Badge>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-dim)",
          display: "flex",
          gap: 8,
        }}
      >
        <span>{run.eventCount} events</span>
        {run.stoppedAt && (
          <span>· {Math.round((run.stoppedAt - run.startedAt) / 1000)}s</span>
        )}
      </div>
      {run.errorMessage && (
        <div
          style={{
            fontSize: 11,
            color: "var(--danger)",
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
    <EmptyState
      icon={<Inbox size={16} />}
      title="No workflow selected"
      body="Save a workflow to stream activity here."
      compact
    />
  ) : tab === "live" ? (
    liveEvents.length === 0 ? (
      <EmptyState
        icon={<Radio size={16} />}
        title="Waiting for events"
        body="Start the workflow to see ticks, decisions, and errors in real time."
        compact
      />
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
          width: 220,
          borderRight: "1px solid var(--hairline)",
          overflowY: "auto",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {runs.length === 0 ? (
          <EmptyState
            icon={<History size={16} />}
            title="No runs yet"
            body="Start the workflow to record a run."
            compact
          />
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
      <div style={{ ...listStyle }}>
        {!selectedRunId ? (
          <EmptyState
            icon={<History size={16} />}
            title="Pick a run"
            body="Select a run on the left to inspect its events."
            compact
          />
        ) : historyLiveShape.length === 0 ? (
          <EmptyState title="No events in this run." compact />
        ) : (
          historyLiveShape.map((e, i) => <EventRow e={e} key={`${e.ts}-${i}`} />)
        )}
      </div>
    </div>
  );

  return (
    <div style={panelStyle}>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "live", label: "Live", icon: <Activity size={12} /> },
          { value: "history", label: "History", icon: <History size={12} /> },
        ]}
      />
      {body}
    </div>
  );
}
