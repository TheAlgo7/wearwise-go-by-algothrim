'use client';

import { Plane } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-5">
      <div
        className="w-20 h-20 rounded-oneui-xl bg-blue-400/10 flex items-center justify-center"
        aria-hidden="true"
      >
        <Plane size={34} className="text-blue-300" strokeWidth={1.8} />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-fog-100 mb-2">You are offline</h1>
        <p className="text-sm text-fog-400 leading-relaxed max-w-[260px] mx-auto">
          Your packing lists are saved. Connect to the internet to generate new lists or sync changes.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="press h-12 rounded-full bg-blue-400 px-6 text-[15px] font-semibold text-ink-0 transition-colors hover:bg-blue-300"
      >
        Try again
      </button>
    </div>
  );
}
