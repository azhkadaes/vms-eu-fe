import { useEffect, useState } from "react";
import { millisecondsUntilNextWitaDate, witaDate } from "@/domain/wita";

export function useWitaToday(): string {
  const [today, setToday] = useState(witaDate);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setToday(witaDate());
      clearTimeout(timer);
      timer = setTimeout(refresh, millisecondsUntilNextWitaDate() + 100);
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}
