const LedIndicator = ({ danger }) => {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-5 w-5 rounded-full border border-white/40 shadow-lg ${
          danger
            ? 'bg-red-500 shadow-red-500/80 animate-pulse'
            : 'bg-emerald-500 shadow-emerald-500/80'
        }`}
      />
      <span className="text-sm font-medium text-slate-200">{danger ? 'Danger' : 'Safe'}</span>
    </div>
  );
};

export default LedIndicator;
