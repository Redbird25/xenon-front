import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import type { SnackbarOrigin } from '@mui/material';

type ToastSeverity = AlertColor;

interface ToastOptions {
  message: string;
  severity?: ToastSeverity;
  durationMs?: number;
  position?: SnackbarOrigin;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, durationMs?: number, position?: SnackbarOrigin) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Required<ToastOptions>>({ message: '', severity: 'info', durationMs: 3500, position: { vertical: 'bottom', horizontal: 'right' } });
  const [queue, setQueue] = useState<Required<ToastOptions>[]>([]);

  const processQueue = useCallback(() => {
    setQueue((q) => {
      if (open || q.length === 0) return q;
      const [next, ...rest] = q;
      setOpts(next);
      setOpen(true);
      return rest;
    });
  }, [open]);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info', durationMs = 3500, position?: SnackbarOrigin) => {
    const next: Required<ToastOptions> = {
      message,
      severity,
      durationMs,
      position: position || { vertical: 'bottom', horizontal: 'right' },
    };
    setQueue((q) => [...q, next]);
  }, []);

  const handleClose = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  React.useEffect(() => { processQueue(); }, [queue, open, processQueue]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        onClose={handleClose}
        autoHideDuration={opts.durationMs}
        anchorOrigin={opts.position}
      >
        <Alert onClose={handleClose} severity={opts.severity} variant="filled" sx={{ width: '100%' }}>
          {opts.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
