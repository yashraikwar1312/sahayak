// src/hooks/useShakeToSOS.ts
// Shake-to-SOS using DeviceMotion API.
//
// Usage in App.tsx:
//
//   import { useShakeToSOS } from './hooks/useShakeToSOS';
//
//   useShakeToSOS({
//     onShake: () => setSosActive(true),
//     enabled: !sosActive,           // don't trigger if SOS already active
//     threshold: 18,                  // m/s² — tune up if too sensitive
//     minShakes: 3,                   // shakes needed within the window
//     windowMs: 1200,                 // sliding window in ms
//   });

import { useEffect, useRef, useCallback, createElement } from 'react';

export interface ShakeOptions {
  /** Called once per shake gesture (debounced). */
  onShake: () => void;
  /** Acceleration magnitude (m/s²) that counts as a single shake peak.
   *  iPhone typical value: 15–25. Reduce to 12 for low-power devices.  */
  threshold?: number;
  /** Number of shake peaks required within `windowMs` to fire onShake. */
  minShakes?: number;
  /** Sliding window in milliseconds. */
  windowMs?: number;
  /** Set false to suspend the listener (e.g. when SOS is already active). */
  enabled?: boolean;
  /** Minimum ms between two consecutive onShake calls (prevents spam). */
  cooldownMs?: number;
}

export function useShakeToSOS({
  onShake,
  threshold = 18,
  minShakes = 3,
  windowMs = 1200,
  enabled = true,
  cooldownMs = 4000,
}: ShakeOptions) {
  // Timestamps of recent shake peaks
  const peakTimestamps = useRef<number[]>([]);
  const lastFiredRef = useRef<number>(0);
  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const permissionAskedRef = useRef(false);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const accel =
        event.accelerationIncludingGravity ?? event.acceleration;
      if (!accel) return;

      const x = accel.x ?? 0;
      const y = accel.y ?? 0;
      const z = accel.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      const prev = lastAccelRef.current;
      lastAccelRef.current = { x, y, z };

      if (!prev) return;

      // Delta magnitude between frames — detects a sharp jolt
      const prevMag = Math.sqrt(prev.x ** 2 + prev.y ** 2 + prev.z ** 2);
      const delta = Math.abs(magnitude - prevMag);

      if (delta > threshold) {
        const now = Date.now();
        peakTimestamps.current.push(now);

        // Keep only peaks within the sliding window
        peakTimestamps.current = peakTimestamps.current.filter(
          t => now - t <= windowMs
        );

        if (
          peakTimestamps.current.length >= minShakes &&
          now - lastFiredRef.current > cooldownMs
        ) {
          peakTimestamps.current = [];
          lastFiredRef.current = now;
          onShake();
        }
      }
    },
    [onShake, threshold, minShakes, windowMs, cooldownMs]
  );

  // iOS 13+ requires a user-gesture permission request for DeviceMotion.
  // We attempt it silently on first add; if it fails, we skip (no crash).
  const requestPermissionIfNeeded = useCallback(async (): Promise<boolean> => {
    if (permissionAskedRef.current) return true;
    permissionAskedRef.current = true;

    const DeviceMotionEventAny = DeviceMotionEvent as any;
    if (typeof DeviceMotionEventAny.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEventAny.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    // Android / non-restricted browsers — permission not needed
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('DeviceMotionEvent' in window)) return;

    let attached = false;

    requestPermissionIfNeeded().then(granted => {
      if (!granted) return;
      window.addEventListener('devicemotion', handleMotion, { passive: true });
      attached = true;
    });

    return () => {
      if (attached) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [enabled, handleMotion, requestPermissionIfNeeded]);
}

// ─── Optional standalone trigger button for iOS permission bootstrap ─────────
// iOS requires the permission request to originate from a user gesture.
// If shake isn't working on iOS after a minute, render this button once.
//
// Example:
//   import { ShakePermissionButton } from './hooks/useShakeToSOS';
//   <ShakePermissionButton />

export function ShakePermissionButton({
  label = 'Enable Shake-to-SOS',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const handleClick = async () => {
    const DeviceMotionEventAny = DeviceMotionEvent as any;
    if (typeof DeviceMotionEventAny.requestPermission === 'function') {
      try {
        await DeviceMotionEventAny.requestPermission();
      } catch {
        // user denied — gracefully ignored
      }
    }
  };

  // Only show on iOS (feature-detected by the presence of requestPermission)
  const needsButton =
    typeof window !== 'undefined' &&
    typeof (DeviceMotionEvent as any).requestPermission === 'function';

  if (!needsButton) return null;

  return createElement(
    'button',
    {
      onClick: handleClick,
      className: `text-xs text-gray-400 underline ${className}`,
    },
    label
  );
}