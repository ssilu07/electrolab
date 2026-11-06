import React from 'react';
import { ToastNotification } from '../types/circuit';
import { AlertCircle, CheckCircle, Info, Zap, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-cyan-500/40 shadow-cyan-500/20';
        let bgColor = 'bg-slate-900/80';
        let Icon = Info;
        let iconColor = 'text-cyan-400';

        if (toast.type === 'danger') {
          borderColor = 'border-red-500/60 shadow-red-500/25';
          bgColor = 'bg-red-950/75';
          Icon = Zap;
          iconColor = 'text-red-400';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/60 shadow-amber-500/25';
          bgColor = 'bg-amber-950/75';
          Icon = AlertCircle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'success') {
          borderColor = 'border-emerald-500/60 shadow-emerald-500/25';
          bgColor = 'bg-emerald-950/75';
          Icon = CheckCircle;
          iconColor = 'text-emerald-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-200 transition`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide">{toast.title}</span>
              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="mt-2 self-start px-3 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 active:scale-95 transition"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
