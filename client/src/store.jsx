import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as apiClient from './api';

// ─── Auth Context ───────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('salesm_token'));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // On mount, validate existing token
  useEffect(() => {
    if (token) {
      apiClient.getMe()
        .then((data) => {
          const u = data.user || data;
          setUser(u);
          setMustChangePassword(!!u.must_change_password);
        })
        .catch(() => {
          localStorage.removeItem('salesm_token');
          localStorage.removeItem('salesm_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const data = await apiClient.login(username, password);
    setToken(data.token);
    setUser(data.user);
    setMustChangePassword(!!data.user.must_change_password);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('salesm_token');
    localStorage.removeItem('salesm_user');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const passwordChanged = useCallback(() => {
    setMustChangePassword(false);
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    mustChangePassword,
    passwordChanged,
  }), [user, token, loading, login, logout, isAuthenticated, mustChangePassword, passwordChanged]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Store Context ──────────────────────────────────────────────────────────

const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Data state
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('salesm_darkMode');
    return saved === 'true';
  });
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dark mode side effect
  useEffect(() => {
    localStorage.setItem('salesm_darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ─── Data loaders ───────────────────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCustomers();
      setCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      const data = await apiClient.getTeam();
      setTeam(Array.isArray(data) ? data : data.members || []);
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  }, []);

  const loadCompetitors = useCallback(async () => {
    try {
      const data = await apiClient.getCompetitors();
      setCompetitors(Array.isArray(data) ? data : data.competitors || []);
    } catch (err) {
      console.error('Failed to load competitors:', err);
    }
  }, []);

  // Load data on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
      loadTeam();
      loadCompetitors();
    }
  }, [isAuthenticated, loadCustomers, loadTeam, loadCompetitors]);

  // ─── Customer operations ────────────────────────────────────────────────

  const addCustomer = useCallback(async (customerData) => {
    const data = await apiClient.createCustomer(customerData);
    const newCustomer = data.customer || data;
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback(async (id, customerData) => {
    const data = await apiClient.updateCustomer(id, customerData);
    const updated = data.customer || data;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    return updated;
  }, []);

  const removeCustomer = useCallback(async (id) => {
    await apiClient.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const moveCustomer = useCallback(async (id, status) => {
    const data = await apiClient.moveCustomer(id, status);
    const updated = data.customer || data;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, status, ...updated } : c)));
    return updated;
  }, []);

  // ─── Competitor operations ──────────────────────────────────────────────

  const addCompetitor = useCallback(async (competitorData) => {
    const data = await apiClient.createCompetitor(competitorData);
    const newCompetitor = data.competitor || data;
    setCompetitors((prev) => [...prev, newCompetitor]);
    return newCompetitor;
  }, []);

  // ─── Filtered customers ─────────────────────────────────────────────────

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = c.name && c.name.toLowerCase().includes(term);
        const matchCompany = c.company && c.company.toLowerCase().includes(term);
        const matchContact = c.contact_person && c.contact_person.toLowerCase().includes(term);
        if (!matchName && !matchCompany && !matchContact) return false;
      }
      if (filterAssignee && c.assigned_to !== filterAssignee) return false;
      if (filterPriority && c.priority !== filterPriority) return false;
      return true;
    });
  }, [customers, searchTerm, filterAssignee, filterPriority]);

  // ─── Import / Export ─────────────────────────────────────────────────────

  const doExportData = useCallback(async () => {
    try {
      const data = await apiClient.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salesm_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, []);

  const doImportData = useCallback(async (importPayload) => {
    try {
      const data = await apiClient.importData(importPayload);
      // Reload all data after import
      await Promise.all([loadCustomers(), loadTeam(), loadCompetitors()]);
      return data;
    } catch (err) {
      console.error('Import failed:', err);
      throw err;
    }
  }, [loadCustomers, loadTeam, loadCompetitors]);

  const exportCSV = useCallback(() => {
    if (customers.length === 0) return;
    const headers = ['name', 'company', 'contact_person', 'phone', 'email', 'status', 'priority', 'amount', 'assigned_to', 'expected_close_date'];
    const csvRows = [headers.join(',')];
    customers.forEach((c) => {
      const row = headers.map((h) => {
        const val = c[h] ?? '';
        // Escape commas and quotes
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(row.join(','));
    });
    const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesm_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [customers]);

  // ─── Context value ──────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // Data
    customers,
    team,
    competitors,
    loading,
    filteredCustomers,

    // Filters
    searchTerm,
    setSearchTerm,
    filterAssignee,
    setFilterAssignee,
    filterPriority,
    setFilterPriority,

    // UI
    darkMode,
    setDarkMode,

    // Customer operations
    loadCustomers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    moveCustomer,

    // Team & competitors
    loadTeam,
    loadCompetitors,
    addCompetitor,

    // Import/Export
    exportData: doExportData,
    importData: doImportData,
    exportCSV,
  }), [
    customers, team, competitors, loading, filteredCustomers,
    searchTerm, filterAssignee, filterPriority,
    darkMode,
    loadCustomers, addCustomer, updateCustomer, removeCustomer, moveCustomer,
    loadTeam, loadCompetitors, addCompetitor,
    doExportData, doImportData, exportCSV,
  ]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
