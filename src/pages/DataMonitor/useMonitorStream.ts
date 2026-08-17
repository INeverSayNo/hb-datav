import { useEffect, useRef } from "react";
import { GetMonitorTable } from "@/api/modules/monitorApi";
import { GATEWAY_URL } from "@/axios-config/request";
import { useMonitorData } from "@/store/useMonitorData";
import type {
  MonitorDataType,
  MonitorEventOperation,
  MonitorSseEvent,
} from "@/types/monitor";

const CLIENT_ID_KEY = "hb-monitor-sse-client-id";
const dataTypes = new Set<MonitorDataType>([
  "wh-shipper",
  "wh-provider",
  "wh-waybill",
  "wh-nodeflow",
  "wh-request-event",
  "wh-transport-capacity",
  "wh-exception-warning",
]);
const operations = new Set<MonitorEventOperation>([
  "created",
  "updated",
  "deleted",
]);

function createClientId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `monitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getClientId() {
  try {
    const saved = window.localStorage.getItem(CLIENT_ID_KEY);
    if (saved) return saved;
    const clientId = createClientId();
    window.localStorage.setItem(CLIENT_ID_KEY, clientId);
    return clientId;
  } catch {
    return createClientId();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMonitorEvent(raw: string): MonitorSseEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !isRecord(value.data)) return null;
    if (
      typeof value.eventId !== "string" ||
      typeof value.eventType !== "string" ||
      typeof value.dataType !== "string" ||
      typeof value.data.id !== "string" ||
      !dataTypes.has(value.dataType as MonitorDataType)
    ) {
      return null;
    }

    const separator = value.eventType.lastIndexOf(":");
    const operation = value.eventType.slice(separator + 1);
    if (
      separator < 1 ||
      value.eventType.slice(0, separator) !== value.dataType ||
      !operations.has(operation as MonitorEventOperation)
    ) {
      return null;
    }

    return value as MonitorSseEvent;
  } catch {
    return null;
  }
}

/** Loads the panel snapshot, then keeps it current through an SSE connection. */
export function useMonitorStream() {
  const setLoading = useMonitorData((state) => state.setLoading);
  const setSnapshot = useMonitorData((state) => state.setSnapshot);
  const applyEvent = useMonitorData((state) => state.applyEvent);
  const lastEventIdRef = useRef("");

  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;
    const clientId = getClientId();

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return;
      const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
      reconnectAttempts += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed) return;
      const url = new URL(
        `/api/resource/screen/subscribe/${encodeURIComponent(clientId)}`,
        GATEWAY_URL,
      );
      if (lastEventIdRef.current) {
        url.searchParams.set("lastEventId", lastEventIdRef.current);
      }

      source = new EventSource(url.toString());
      source.onopen = () => {
        reconnectAttempts = 0;
      };
      source.onmessage = (message) => {
        const event = parseMonitorEvent(message.data);
        if (!event) {
          console.warn("Ignored malformed monitor SSE event", message.data);
          return;
        }
        applyEvent(event);
        lastEventIdRef.current = event.eventId;
      };
      source.onerror = () => {
        source?.close();
        source = null;
        scheduleReconnect();
      };
    };

    const bootstrap = async () => {
      setLoading(true);
      const [error, response] = await GetMonitorTable();
      if (!disposed) {
        if (!error && response?.result) {
          setSnapshot(response.result);
        } else {
          setLoading(false);
          if (error) console.error("Failed to load monitor snapshot", error);
        }
        connect();
      }
    };

    void bootstrap();

    return () => {
      disposed = true;
      source?.close();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, [applyEvent, setLoading, setSnapshot]);
}
