export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-5">
      <div
        className="w-20 h-20 rounded-oneui-xl bg-teal-400/10 flex items-center justify-center text-4xl"
        aria-hidden="true"
      >
        ✈️
      </div>
      <div>
        <h1 className="text-xl font-semibold text-fog-100 mb-2">You are offline</h1>
        <p className="text-sm text-fog-600 leading-relaxed max-w-[260px] mx-auto">
          Your packing lists are saved. Connect to the internet to generate new lists or sync changes.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-teal-400 text-ink-0 rounded-oneui font-medium text-sm hover:bg-teal-500 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
