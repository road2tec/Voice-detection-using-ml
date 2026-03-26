const AlertCard = ({ alert }) => {
  return (
    <article
      className={`rounded-xl border p-4 transition ${
        alert.danger ? 'border-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-800/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">User: {alert.userName || alert.userId || 'Unknown'}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.danger ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
          {alert.danger ? 'Danger' : 'Safe'}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-white">{alert.label}</h3>
      <p className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</p>
    </article>
  );
};

export default AlertCard;
