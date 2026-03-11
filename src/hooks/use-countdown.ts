import { useEffect, useRef, useState } from "react";

export type UseCountdownPayload =  {
  startValue: number; // с чего начинать
  running: boolean;    // true — идёт, false — стоит
  delay?: number;
};

export function useCountdown({ startValue, running, delay }: UseCountdownPayload) {
  const [value, setValue] = useState(startValue);
  const idRef = useRef<number | undefined>(undefined);

  // Перезапуск при изменении стартового значения
  useEffect(() => setValue(startValue), [startValue, running]);

  useEffect(() => {
    // если не нужно крутить — выходим и чистим интервал
    if (!running || !value || value <= 0) {
      clearInterval(idRef.current);
      return;
    }

    idRef.current = window.setInterval(() => {
      setValue((v) => {
        if (v <= 1) {
          clearInterval(idRef.current);
          return 0;
        }
        return v - 1;
      });
    }, delay ?? 1000);

    return () => clearInterval(idRef.current);
  }, [running, value]);

  return value;
}