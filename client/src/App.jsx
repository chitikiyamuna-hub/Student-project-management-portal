import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Clock, 
  Play, 
  Loader2, 
  Sparkles, 
  Database,
  AlertTriangle,
  X,
  Check,
  Info,
  LogOut,
  User,
  Lock,
  Mail,
  GraduationCap,
  LayoutDashboard,
  FolderGit2,
  Menu,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { taskApi, registerToastDispatcher } from './api';

// --- Toast Component Helper ---
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 scale-100 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-grow mr-2">
            <p className="text-sm font-medium leading-5">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Skeleton Card Loader ---
function TaskSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col justify-between h-44">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="h-6 w-20 rounded-full shimmer"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg shimmer"></div>
            <div className="h-8 w-8 rounded-lg shimmer"></div>
          </div>
        </div>
        <div className="h-5 w-3/4 rounded-md shimmer mb-2"></div>
        <div className="h-4 w-full rounded-md shimmer mb-1"></div>
        <div className="h-4 w-5/6 rounded-md shimmer"></div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-3 w-24 rounded shimmer"></div>
        <div className="h-3 w-16 rounded shimmer"></div>
      </div>
    </div>
  );
}

export default function App() {
  // --- Auth Session States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Login form states
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('student@veltech.edu.in');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [authLoading, setAuthLoading] = useState(false);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regBranch, setRegBranch] = useState('B.Tech Computer Science & Eng.');
  const [regPassword, setRegPassword] = useState('');
  const [authValidationErrors, setAuthValidationErrors] = useState({});

  // --- Layout States ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tasks'

  // --- Task Operations States ---
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [activeDb, setActiveDb] = useState('memory');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'Pending' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Control
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Toast Stack State
  const [toasts, setToasts] = useState([]);

  // --- Toast Dispatchers ---
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Register Axios error interceptor callback
  useEffect(() => {
    registerToastDispatcher(showToast);
  }, [showToast]);

  // --- Dark Mode Apply Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- API Data Fetching ---
  const fetchTasks = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const response = await taskApi.getAll({ search, status: statusFilter, sort });
      if (response && response.success) {
        setTasks(response.data);
        setActiveDb(response.activeDatabase);
      }
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, isLoggedIn]);

  const fetchStats = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const response = await taskApi.getStats();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Stats loading failed', err);
    }
  }, [isLoggedIn]);

  // Fetch on mount or parameters update
  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // --- Authenticate handler (API call) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthValidationErrors({});

    if (!loginEmail.trim()) {
      setAuthValidationErrors({ loginEmail: 'Email is required' });
      return;
    }
    if (!loginPassword) {
      setAuthValidationErrors({ loginPassword: 'Password is required' });
      return;
    }

    setAuthLoading(true);
    try {
      const response = await taskApi.login({
        email: loginEmail,
        password: loginPassword
      });

      if (response && response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        
        setCurrentUser(response.data);
        setIsLoggedIn(true);
        showToast(`Welcome back, ${response.data.name}!`, 'success');
      }
    } catch (err) {
      // Errors handled by Axios interceptor toast alert
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthValidationErrors({});
    const errors = {};

    if (!regName.trim()) errors.name = 'Full name is required';
    if (!regEmail.trim()) errors.email = 'Email address is required';
    if (!regRollNo.trim()) errors.rollNo = 'Roll number / Student ID is required';
    if (!regPassword || regPassword.length < 6) errors.password = 'Password must be at least 6 characters';

    if (Object.keys(errors).length > 0) {
      setAuthValidationErrors(errors);
      return;
    }

    setAuthLoading(true);
    try {
      const response = await taskApi.register({
        name: regName,
        email: regEmail,
        rollNo: regRollNo,
        branch: regBranch,
        password: regPassword
      });

      if (response && response.success) {
        showToast('Registration successful! Please sign in using your credentials.', 'success');
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
        setAuthTab('login');
        // Reset registration fields
        setRegName('');
        setRegEmail('');
        setRegRollNo('');
        setRegPassword('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTasks([]);
    setStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    showToast('Logged out successfully.', 'info');
  };

  // --- CRUD Event Handlers ---
  const openCreateModal = () => {
    setModalMode('create');
    setEditingTask(null);
    setFormData({ title: '', description: '', status: 'Pending' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const response = await taskApi.create(formData);
        if (response && response.success) {
          showToast('Project task created successfully!', 'success');
          setIsModalOpen(false);
          fetchTasks();
          fetchStats();
        }
      } else {
        const response = await taskApi.update(editingTask.id, formData);
        if (response && response.success) {
          showToast('Project task updated successfully!', 'success');
          setIsModalOpen(false);
          fetchTasks();
          fetchStats();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDeleteConfirm = (task) => {
    setTaskToDelete(task);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const response = await taskApi.delete(taskToDelete.id);
      if (response && response.success) {
        showToast(`Task "${taskToDelete.title}" deleted successfully.`, 'success');
        setTaskToDelete(null);
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (task) => {
    const statusCycle = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending'
    };
    const nextStatus = statusCycle[task.status] || 'Pending';
    try {
      const response = await taskApi.update(task.id, { status: nextStatus });
      if (response && response.success) {
        showToast(`Updated status to "${nextStatus}"`, 'info');
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Dynamic Color Styles Helper ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">
            <Play className="w-3 h-3 animate-pulse-subtle" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // ==========================================
  // 🚪 RENDER AUTH SCREEN (LOGIN & REGISTER)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
        
        {/* Toast Drawer */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        {/* Float Animation Shapes */}
        <div className="hidden md:block absolute top-[20%] right-[15%] w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 to-violet-500 opacity-20 blur-[1px] animate-float"></div>
        <div className="hidden md:block absolute bottom-[25%] left-[10%] w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 blur-[2px] animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Auth Layout Card */}
        <div className="w-full max-w-md p-8 rounded-3xl glass shadow-2xl relative border border-white/40 dark:border-white/5 z-10 animate-slide-up">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/25 animate-pulse-subtle mb-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Evaluation Portal
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Vel Tech University Project Milestones
            </p>
          </div>

          {/* Authentication Tab Selection */}
          <div className="flex border-b border-slate-100 dark:border-slate-800/80 mb-6">
            <button
              onClick={() => { setAuthTab('login'); setAuthValidationErrors({}); }}
              className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'login'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => { setAuthTab('register'); setAuthValidationErrors({}); }}
              className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'register'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* --- SIGN IN FORM --- */}
          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@veltech.edu.in"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                      authValidationErrors.loginEmail 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                </div>
                {authValidationErrors.loginEmail && (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{authValidationErrors.loginEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                      authValidationErrors.loginPassword 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                </div>
                {authValidationErrors.loginPassword && (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{authValidationErrors.loginPassword}</p>
                )}
              </div>

              {/* Demo Hint */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl text-[10px] text-indigo-500 dark:text-indigo-400 leading-relaxed border border-indigo-100/50 dark:border-indigo-900/10">
                💡 **Demo Mode**: The default evaluator credentials (`student@veltech.edu.in` / `password123`) will load the **10 pre-seeded projects** automatically!
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-700 hover:to-indigo-700 shadow-lg shadow-brand-500/20 transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In Portal</span>}
              </button>
            </form>
          )}

          {/* --- SIGN UP (REGISTER) FORM --- */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Manoj Kumar S"
                  className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                    authValidationErrors.name ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                  }`}
                />
                {authValidationErrors.name && (
                  <p className="text-[9px] text-rose-500 mt-0.5 font-semibold">{authValidationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="manojs@veltech.edu.in"
                  className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                    authValidationErrors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                  }`}
                />
                {authValidationErrors.email && (
                  <p className="text-[9px] text-rose-500 mt-0.5 font-semibold">{authValidationErrors.email}</p>
                )}
              </div>

              {/* Roll Number & Branch (Flex) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Student ID / Roll No
                  </label>
                  <input
                    type="text"
                    value={regRollNo}
                    onChange={(e) => setRegRollNo(e.target.value)}
                    placeholder="VT2026-3853"
                    className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                      authValidationErrors.rollNo ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                    }`}
                  />
                  {authValidationErrors.rollNo && (
                    <p className="text-[9px] text-rose-500 mt-0.5 font-semibold">{authValidationErrors.rollNo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-brand-500 appearance-none cursor-pointer"
                    >
                      <option value="B.Tech Computer Science & Eng.">B.Tech CSE</option>
                      <option value="B.Tech Information Technology">B.Tech IT</option>
                      <option value="B.Tech Electronics & Comm.">B.Tech ECE</option>
                      <option value="B.Tech Mechanical Eng.">B.Tech ME</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-1.5 h-1.5 border-r border-b border-slate-400 rotate-45"></div>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Choose Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                    authValidationErrors.password ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800 focus:border-brand-500'
                  }`}
                />
                {authValidationErrors.password && (
                  <p className="text-[9px] text-rose-500 mt-0.5 font-semibold">{authValidationErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-700 hover:to-indigo-700 shadow-lg shadow-brand-500/25 transition-all text-xs cursor-pointer disabled:opacity-50 mt-4"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Register Student Profile</span>}
              </button>
            </form>
          )}

          {/* Color Switcher */}
          <div className="mt-6 flex justify-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-2 text-[10px] font-semibold cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>Toggle Colors</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🏢 RENDER MAIN PORTAL (IF LOGGED IN)
  // ==========================================
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Toast Drawer */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Mobile Hamburger menu */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 p-3.5 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all cursor-pointer"
        title="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* ==========================================
          SIDEBAR NAVIGATION DRAWER
          ========================================== */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-transform duration-300 transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white">
                <Sparkles className="w-5 h-5 animate-pulse-subtle" />
              </div>
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Student Mini Portal
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile details card */}
          {currentUser && (
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 font-bold text-sm flex items-center justify-center shrink-0">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate animate-pulse-subtle" title={currentUser.name}>
                    {currentUser.name}
                  </h4>
                  <p className="text-[9px] font-mono text-slate-400 truncate">{currentUser.rollNo}</p>
                </div>
              </div>
              
              <div className="mt-3.5 space-y-1 text-[10px] text-slate-400">
                <p className="truncate"><strong className="text-slate-500 dark:text-slate-400">Mail:</strong> {currentUser.email}</p>
                <p className="truncate"><strong className="text-slate-500 dark:text-slate-400">Dept:</strong> {currentUser.branch}</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Statistics Dashboard</span>
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-400'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Project Tasks Manager</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {stats.total}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer details */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* Active database type badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <Database className="w-3.5 h-3.5 text-brand-500" />
            <span>Active DB:</span>
            <span className="ml-auto font-bold uppercase text-[9px] bg-slate-150 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
              {activeDb === 'memory' ? 'In-Memory fallback' : activeDb}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 rounded-xl transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* BACKDROP SHIELD FOR MOBILE MENU */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs"
        />
      )}

      {/* ==========================================
          MAIN APPLICATION WORKSPACE
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Main top header bar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sm:px-8">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {activeTab === 'dashboard' ? 'Overview Statistics' : 'Project Tasks Repository'}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Vel Tech Evaluation • Academic Milestones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Evaluation Active</span>
          </div>
        </header>

        {/* Workspace scroll body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* TAB 1: DASHBOARD STATISTICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Database notification header removed for production layout */}

              {/* Statistics Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* Total card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab('tasks')}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Total Projects</p>
                  <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{stats.total}</h3>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-brand-600 dark:text-brand-400">
                    <span>Manage repository</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>

                {/* Pending card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Pending</p>
                  <h3 className="text-3xl font-bold mt-2 text-amber-600 dark:text-amber-400">{stats.pending}</h3>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-amber-500/80">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>Awaiting kickoff</span>
                  </div>
                </div>

                {/* In Progress card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">In Progress</p>
                  <h3 className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">{stats.inProgress}</h3>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-blue-500/80">
                    <Play className="w-3.5 h-3.5 mr-1 animate-pulse" />
                    <span>Development phase</span>
                  </div>
                </div>

                {/* Completed card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Completed</p>
                  <h3 className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{stats.completed}</h3>
                  <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-500/80">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Evaluation ready</span>
                  </div>
                </div>

              </div>

              {/* Graphical Card panel */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Progress Ratios</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Project ratios representing your registered project statistics.</p>
                  </div>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors cursor-pointer">
                    Detailed View
                  </button>
                </div>

                {stats.total === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-450 italic">No tasks registered to render progress rates.</p>
                    <button 
                      onClick={() => { setActiveTab('tasks'); openCreateModal(); }}
                      className="mt-3 text-xs font-bold text-brand-500 hover:underline cursor-pointer"
                    >
                      Register your first task →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {/* Ratio Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Completed Projects ({stats.completed} of {stats.total})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((stats.completed / stats.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>In Development ({stats.inProgress} of {stats.total})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((stats.inProgress / stats.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Awaiting Kickoff ({stats.pending} of {stats.total})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((stats.pending / stats.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TASKS MANAGER */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Controls bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
                  
                  {/* Search Input */}
                  <div className="relative w-full sm:flex-1 md:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tasks by title or description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-40 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-1.5 h-1.5 border-r border-b border-slate-400 rotate-45"></div>
                  </div>

                  {/* Sort Selector */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full sm:w-40 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-1.5 h-1.5 border-r border-b border-slate-400 rotate-45"></div>
                  </div>
                </div>

                {/* Add task CTA */}
                <button
                  onClick={openCreateModal}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all text-sm shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>

              {/* Tasks Grid List */}
              <div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <TaskSkeleton />
                    <TaskSkeleton />
                    <TaskSkeleton />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl min-h-[300px]">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 mb-4">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No project tasks found</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-2">
                      No records match the requested search keywords or filter status. If you are a new student, click "Create Task" to register your first mini project milestone!
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register First Project</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {tasks.map((task) => {
                      const leftBorderColor = 
                        task.status === 'Completed' ? 'border-l-emerald-500' :
                        task.status === 'In Progress' ? 'border-l-blue-500' :
                        'border-l-amber-500';

                      return (
                        <div
                          key={task.id}
                          className={`group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 border-l-4 ${leftBorderColor} hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-48`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2.5">
                              <button 
                                onClick={() => toggleTaskStatus(task)} 
                                title="Click to toggle status cycle"
                                className="cursor-pointer animate-fade-in"
                              >
                                {getStatusBadge(task.status)}
                              </button>

                              {/* Task Operations */}
                              <div className="flex gap-1 opacity-85 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer"
                                  title="Edit Task"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => triggerDeleteConfirm(task)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-200/50 dark:hover:text-rose-400 dark:hover:border-rose-900/30 transition-colors cursor-pointer"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 line-clamp-1 mb-1.5" title={task.title}>
                              {task.title}
                            </h4>
                            
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2" title={task.description}>
                              {task.description || <span className="italic opacity-60">No details described.</span>}
                            </p>
                          </div>

                          {/* Timestamps */}
                          <div className="flex items-center justify-between mt-4 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                            <span>Created: {new Date(task.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                              <span className="italic font-bold text-brand-500">Edited</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- TASK CREATION / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Create Evaluation Task' : 'Edit Evaluation Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                
                {/* Task Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project task title..."
                    className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                      formErrors.title 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.title}</p>
                  )}
                </div>

                {/* Task Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe implementation stack, MQTT settings, or framework objectives..."
                    className={`w-full px-4 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                      formErrors.description 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.description}</p>
                  )}
                </div>

                {/* Task Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-1.5 h-1.5 border-r border-b border-slate-400 rotate-45"></div>
                  </div>
                </div>

              </div>

              {/* Modal Footer actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Task' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION DELETE DIALOG --- */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Delete Project Task
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Are you sure you want to delete <span className="font-bold text-slate-750 dark:text-slate-200">"{taskToDelete.title}"</span>? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Action Buttons */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
