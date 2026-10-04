const METRIKA_ID = 111940922;

export const sendMetricGoal = (goalName: string): void => {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(METRIKA_ID, "reachGoal", goalName);
};
