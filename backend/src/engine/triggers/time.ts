export interface TimeTriggerHandle {
  stop: () => void;
}

export function startTimeTrigger({
  intervalMs,
  handler,
}: {
  intervalMs: number;
  handler: () => void | Promise<void>;
}): TimeTriggerHandle {
  const run = () => {
    Promise.resolve()
      .then(() => handler())
      .catch(() => {
        /* handler owns its errors */
      });
  };
  run();
  const id = setInterval(run, intervalMs);
  return {
    stop: () => clearInterval(id),
  };
}
