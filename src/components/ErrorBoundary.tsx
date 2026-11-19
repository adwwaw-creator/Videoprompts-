import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Application ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-[#0A0B10] dark:text-slate-100"
        >
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-start shadow-sm dark:border-red-900/50 dark:bg-[#13161F]">
            <h2 className="text-base font-bold text-red-700 dark:text-red-300">
              حدث خطأ غير متوقع
            </h2>
            <p className="mt-2 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05]"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
