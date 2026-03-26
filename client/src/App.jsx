import { useCallback, useEffect, useRef, useState } from 'react';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthCard from './components/AuthCard';
import { getAdminAlerts, getUserAlerts, getUsers, seedUsers } from './services/api';
import { useSocket } from './hooks/useSocket';
import { playBuzzer } from './utils/audio';

const AUTH_STORAGE_KEY = 'noiseguard_auth_user';

const getStoredAuthUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function App() {
  const [authUser, setAuthUser] = useState(getStoredAuthUser);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userHistory, setUserHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [flashAlert, setFlashAlert] = useState(false);
  const [activeTab, setActiveTab] = useState(getStoredAuthUser()?.role === 'admin' ? 'admin' : 'user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const flashTimeoutRef = useRef(null);

  const onNewAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 100));

    if (authUser?.role === 'admin') {
      playBuzzer();
      setFlashAlert(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setFlashAlert(false);
      }, 2500);
    }
  }, [authUser]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useSocket({ onNewAlert });

  const loadBootstrapData = useCallback(async () => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      await seedUsers();

      const [usersData, alertsData] = await Promise.all([getUsers(), getAdminAlerts()]);

      setUsers(usersData);
      setAlerts(alertsData || []);

      if (authUser.role === 'admin') {
        if (usersData.length > 0) {
          setSelectedUserId(usersData[0]._id);
        }
      } else {
        setSelectedUserId(authUser.id || '');
      }
    } catch (bootstrapError) {
      setError(
        bootstrapError?.response?.data?.message ||
          bootstrapError?.message ||
          'Failed to load initial data.',
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadBootstrapData();
  }, [loadBootstrapData]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const fetchUserHistory = async () => {
      if (!selectedUserId) {
        setUserHistory([]);
        return;
      }

      try {
        const history = await getUserAlerts(selectedUserId);
        setUserHistory(history);
      } catch {
        setUserHistory([]);
      }
    };

    fetchUserHistory();
  }, [selectedUserId, authUser]);

  const subtitle =
    'Real-time environmental sound monitoring with AI-assisted threat detection for Fire, Gunshot, Vehicle, and Unknown sounds.';

  const handleAuthSuccess = (user) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setAuthUser(user);
    setActiveTab(user.role === 'admin' ? 'admin' : 'user');
    setSelectedUserId(user.role === 'admin' ? '' : user.id);
    setError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
        },
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthUser(null);
    setUsers([]);
    setAlerts([]);
    setFlashAlert(false);
    setUserHistory([]);
    setSelectedUserId('');
    setActiveTab('user');
    setLocation(null);
  };

  if (!authUser) {
    return <AuthCard onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">NoiseGuard AI</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">{subtitle}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-blue-400 capitalize tracking-wide bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20">
              {authUser.role} Dashboard
            </span>

            <span className="ml-auto text-sm text-slate-300">
              Signed in as {authUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 text-slate-300">
            Loading NoiseGuard AI dashboard...
          </section>
        ) : (
          <>
            {error && (
              <section className="rounded-2xl border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-200">
                {error}
              </section>
            )}

            {activeTab === 'user' ? (
              <UserDashboard
                users={users}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                history={userHistory}
                setHistory={setUserHistory}
                lockUserSelection={authUser.role !== 'admin'}
                location={location}
              />
            ) : (
              <AdminDashboard users={users} alerts={alerts} flashAlert={flashAlert} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default App;
