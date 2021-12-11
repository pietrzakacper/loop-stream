export const sleep = (timeMs: number): Promise<void> =>
  new Promise(res => setTimeout(res, timeMs));
