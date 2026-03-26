import AlertCard from './AlertCard';

const AdminDashboard = ({ users, alerts, flashAlert }) => {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              flashAlert ? 'animate-ping bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]' : 'bg-emerald-500'
            }`}
          />
          <span className={`text-xs font-semibold uppercase tracking-wide ${flashAlert ? 'text-red-300' : 'text-emerald-300'}`}>
            {flashAlert ? 'Alert Active' : 'Monitoring'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Users</h3>
          <div className="mt-3 space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user._id} className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
                  <p className="font-medium text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Real-Time Alerts</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500">No alerts received yet.</p>
            ) : (
              alerts.map((alert) => <AlertCard key={alert.id || alert._id} alert={alert} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
