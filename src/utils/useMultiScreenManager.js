import { useState, useEffect, useRef, useCallback } from 'react';

// Shared window reference across components
let globalCustomerWindow = null;

export function useMultiScreenManager() {
  const [isMultiScreen, setIsMultiScreen] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.screen?.isExtended);
  });

  const [screenCount, setScreenCount] = useState(() => {
    return typeof window !== 'undefined' && window.screen?.isExtended ? 2 : 1;
  });

  const [screensList, setScreensList] = useState([]);
  const [primaryScreen, setPrimaryScreen] = useState(null);
  const [secondaryScreen, setSecondaryScreen] = useState(null);

  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_auto_hdmi');
      // Default to true for automated dual-monitor experience
      return saved === null ? true : saved !== 'false';
    } catch {
      return true;
    }
  });

  const [isWindowOpen, setIsWindowOpen] = useState(() => {
    return Boolean(globalCustomerWindow && !globalCustomerWindow.closed);
  });

  const [hasPermission, setHasPermission] = useState(null); // null = unknown, true = granted, false = denied/prompt
  const [autoLaunchBlocked, setAutoLaunchBlocked] = useState(false);
  const [lastEventMsg, setLastEventMsg] = useState('');

  const screenDetailsRef = useRef(null);
  const prevMultiScreenRef = useRef(isMultiScreen);

  // Play audio sound on HDMI connect or disconnect
  const playSoundEffect = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'connect') {
        // Dual chime
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'disconnect') {
        // Soft drop chime
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // AudioContext suppressed or not supported
    }
  }, []);

  // Update screen topology from ScreenDetails object
  const updateScreenTopology = useCallback((details) => {
    if (!details || !details.screens) return;
    const screens = details.screens;
    setScreensList(screens);
    setScreenCount(screens.length);

    const isExt = screens.length > 1;
    setIsMultiScreen(isExt);

    const primary = screens.find((s) => s.isPrimary) || screens[0];
    const secondary = screens.find((s) => !s.isPrimary) || (screens.length > 1 ? screens[1] : null);

    setPrimaryScreen(primary || null);
    setSecondaryScreen(secondary || null);
  }, []);

  // Check window permission status
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'window-management' })
        .then((status) => {
          setHasPermission(status.state === 'granted');
          status.onchange = () => {
            setHasPermission(status.state === 'granted');
          };
        })
        .catch(() => {
          // 'window-management' permission query may throw on unsupported browsers
          setHasPermission(null);
        });
    }
  }, []);

  // Open or focus customer display window on secondary screen
  const openCustomerDisplay = useCallback((explicitTargetScreen = null) => {
    const url = `${window.location.origin}${window.location.pathname}?view=customer-display`;
    const target = explicitTargetScreen || secondaryScreen;

    let left = 1920;
    let top = 0;
    let width = 1280;
    let height = 850;

    if (target) {
      left = target.availLeft ?? target.left ?? window.screen.availWidth ?? 1920;
      top = target.availTop ?? target.top ?? 0;
      width = target.availWidth ?? target.width ?? 1280;
      height = target.availHeight ?? target.height ?? 850;
    } else if (window.screen?.availWidth) {
      // Fallback: place immediately to the right of the primary display
      left = window.screen.availWidth;
      top = 0;
      width = window.screen.availWidth;
      height = window.screen.availHeight;
    }

    const windowFeatures = [
      `left=${left}`,
      `top=${top}`,
      `width=${width}`,
      `height=${height}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes',
      'scrollbars=no'
    ].join(',');

    try {
      // If already open, focus and optionally reposition
      if (globalCustomerWindow && !globalCustomerWindow.closed) {
        try {
          globalCustomerWindow.focus();
          // Attempt to move to secondary screen if coordinates changed
          if (left !== undefined && top !== undefined) {
            globalCustomerWindow.moveTo(left, top);
          }
        } catch {
          // Cross-origin or restricted window movement
        }
        setIsWindowOpen(true);
        setAutoLaunchBlocked(false);
        return globalCustomerWindow;
      }

      const win = window.open(url, 'NKB_Canteen_Customer_Display', windowFeatures);

      if (win && !win.closed) {
        globalCustomerWindow = win;
        setIsWindowOpen(true);
        setAutoLaunchBlocked(false);
        try {
          win.focus();
        } catch {
          // ignore
        }
        return win;
      } else {
        // Pop-up was blocked by browser
        console.warn('Window open was blocked. User gesture required or popups disabled.');
        setAutoLaunchBlocked(true);
        return null;
      }
    } catch (err) {
      console.warn('Error opening customer display window:', err);
      setAutoLaunchBlocked(true);
      return null;
    }
  }, [secondaryScreen]);

  // Close customer display window
  const closeCustomerDisplay = useCallback(() => {
    if (globalCustomerWindow && !globalCustomerWindow.closed) {
      try {
        globalCustomerWindow.close();
      } catch (err) {
        console.warn('Failed to close display window:', err);
      }
    }
    globalCustomerWindow = null;
    setIsWindowOpen(false);
  }, []);

  // Request window management permission and trigger getScreenDetails
  const requestScreenPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
      try {
        const details = await window.getScreenDetails();
        screenDetailsRef.current = details;
        updateScreenTopology(details);
        setHasPermission(true);

        // If secondary screen is present, launch display
        const sec = details.screens.find((s) => !s.isPrimary) || (details.screens.length > 1 ? details.screens[1] : null);
        if (sec) {
          openCustomerDisplay(sec);
        }
        return details;
      } catch (err) {
        console.warn('getScreenDetails prompt error/dismissed:', err);
        setHasPermission(false);
        return null;
      }
    } else {
      // Fallback: standard open
      openCustomerDisplay();
      return null;
    }
  }, [openCustomerDisplay, updateScreenTopology]);

  // Toggle Auto-Launch preference
  const toggleAutoLaunch = useCallback(async (enabled) => {
    const nextVal = typeof enabled === 'boolean' ? enabled : !isAutoLaunchEnabled;
    setIsAutoLaunchEnabled(nextVal);
    try {
      localStorage.setItem('nkb_canteen_auto_hdmi', String(nextVal));
    } catch {
      // ignore
    }

    if (nextVal) {
      // If turning ON, ensure we request screen details / permission if available
      if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
        try {
          const details = await window.getScreenDetails();
          screenDetailsRef.current = details;
          updateScreenTopology(details);
          setHasPermission(true);

          if (details.screens.length > 1) {
            const sec = details.screens.find((s) => !s.isPrimary) || details.screens[1];
            openCustomerDisplay(sec);
          }
        } catch {
          // If cancelled or permission denied, fallback to standard check
          if (window.screen?.isExtended) {
            openCustomerDisplay();
          }
        }
      } else if (window.screen?.isExtended) {
        openCustomerDisplay();
      }
    }
  }, [isAutoLaunchEnabled, openCustomerDisplay, updateScreenTopology]);

  // Initialize ScreenDetails listener if permission was already granted
  useEffect(() => {
    let isMounted = true;

    async function initScreenDetails() {
      if (typeof window === 'undefined' || !('getScreenDetails' in window)) return;

      try {
        // Query permission first to avoid unsolicited permission prompts
        if (navigator.permissions?.query) {
          const perm = await navigator.permissions.query({ name: 'window-management' });
          if (perm.state !== 'granted') return;
        }

        const details = await window.getScreenDetails();
        if (!isMounted) return;

        screenDetailsRef.current = details;
        updateScreenTopology(details);
        setHasPermission(true);

        const handleScreensChange = () => {
          if (!isMounted) return;
          updateScreenTopology(details);
          const extended = details.screens.length > 1;
          const prevExt = prevMultiScreenRef.current;
          prevMultiScreenRef.current = extended;

          if (extended && !prevExt) {
            // HDMI connected!
            playSoundEffect('connect');
            setLastEventMsg('External HDMI Monitor Connected');
            const sec = details.screens.find((s) => !s.isPrimary) || details.screens[1];
            if (isAutoLaunchEnabled) {
              openCustomerDisplay(sec);
            }
          } else if (!extended && prevExt) {
            // HDMI unplugged
            playSoundEffect('disconnect');
            setLastEventMsg('External HDMI Monitor Disconnected');
          }
        };

        details.addEventListener('screenschange', handleScreensChange);
        details.addEventListener('currentscreenchange', handleScreensChange);

        return () => {
          details.removeEventListener('screenschange', handleScreensChange);
          details.removeEventListener('currentscreenchange', handleScreensChange);
        };
      } catch (err) {
        // Permission not yet granted or unsupported
      }
    }

    initScreenDetails();

    return () => {
      isMounted = false;
    };
  }, [isAutoLaunchEnabled, openCustomerDisplay, playSoundEffect, updateScreenTopology]);

  // Fallback Polling & Event Listeners for window.screen.isExtended
  useEffect(() => {
    const checkScreenState = () => {
      const ext = Boolean(window.screen?.isExtended);
      const prevExt = prevMultiScreenRef.current;

      setIsMultiScreen(ext);
      setScreenCount(ext ? 2 : 1);

      // Check if global window was closed externally
      if (globalCustomerWindow) {
        setIsWindowOpen(!globalCustomerWindow.closed);
      } else {
        setIsWindowOpen(false);
      }

      // Detect HDMI cable plug-in transition
      if (ext && !prevExt) {
        prevMultiScreenRef.current = true;
        playSoundEffect('connect');
        setLastEventMsg('HDMI Cable Connected (Extended Display Active)');

        if (isAutoLaunchEnabled && (!globalCustomerWindow || globalCustomerWindow.closed)) {
          openCustomerDisplay();
        }
      } else if (!ext && prevExt) {
        prevMultiScreenRef.current = false;
        playSoundEffect('disconnect');
        setLastEventMsg('HDMI Cable Disconnected (Single Screen Mode)');
      }
    };

    // Run check on mount
    checkScreenState();

    // Listeners for screen/window changes
    window.addEventListener('resize', checkScreenState);
    if (window.screen?.addEventListener) {
      window.screen.addEventListener('change', checkScreenState);
    }

    // Polling interval (1.5s) to guarantee fast HDMI detection
    const interval = setInterval(checkScreenState, 1500);

    return () => {
      window.removeEventListener('resize', checkScreenState);
      if (window.screen?.removeEventListener) {
        window.screen.removeEventListener('change', checkScreenState);
      }
      clearInterval(interval);
    };
  }, [isAutoLaunchEnabled, openCustomerDisplay, playSoundEffect]);

  // Formulate status label
  let hdmiStatusText = 'Single Monitor (Plug in HDMI cable)';
  if (isMultiScreen) {
    if (secondaryScreen) {
      const w = secondaryScreen.availWidth || secondaryScreen.width || 1920;
      const h = secondaryScreen.availHeight || secondaryScreen.height || 1080;
      hdmiStatusText = `HDMI Monitor Connected (${w}×${h})`;
    } else {
      hdmiStatusText = 'Dual Monitor Connected (HDMI Ready)';
    }
  }

  return {
    isMultiScreen,
    screenCount,
    primaryScreen,
    secondaryScreen,
    isAutoLaunchEnabled,
    toggleAutoLaunch,
    isWindowOpen,
    openCustomerDisplay,
    closeCustomerDisplay,
    hdmiStatusText,
    hasPermission,
    requestScreenPermission,
    autoLaunchBlocked,
    dismissBlockedPrompt: () => setAutoLaunchBlocked(false),
    lastEventMsg
  };
}
