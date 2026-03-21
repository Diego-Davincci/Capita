import { useEffect, useState } from "react";

/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change to `value`. Useful for deferring API calls
 * until the user stops typing.
 *
 * @test value changes rapidly → only the last value is emitted after delay
 * @test delay=0 → behaves like direct state (emits on next tick)
 * @test component unmounts mid-delay → no state update after unmount
 */
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
