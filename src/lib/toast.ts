export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastCallback = (toast: ToastMessage) => void;

class ToastManager {
  private listeners: Set<ToastCallback> = new Set();

  subscribe(callback: ToastCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  show(type: ToastType, message: string, duration = 4000) {
    const toast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration,
    };
    this.listeners.forEach((listener) => listener(toast));
  }

  success(message: string, duration?: number) {
    this.show("success", message, duration);
  }

  error(message: string, duration?: number) {
    this.show("error", message, duration);
  }

  info(message: string, duration?: number) {
    this.show("info", message, duration);
  }

  warning(message: string, duration?: number) {
    this.show("warning", message, duration);
  }
}

export const toast = new ToastManager();
