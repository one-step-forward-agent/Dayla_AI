interface Window {
  ym?: (
    counterId: number,
    method: string,
    ...args: any[]
  ) => void;
}
