import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class FirebaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let display = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(display);
      if (parsed && typeof parsed.error === 'string') {
        display = `Permission or connectivity issue (${parsed.operationType || 'read'}): ${parsed.error}`;
      }
    } catch {
      // keep original message
    }
    return { hasError: true, message: display };
  }

  componentDidCatch(error: Error) {
    console.error('FirebaseErrorBoundary caught error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6 text-[#0F172A]">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm text-center">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-lg font-bold mb-2">Service Error</h2>
            <p className="text-sm text-[#64748B] mb-5 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
