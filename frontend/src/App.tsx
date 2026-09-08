import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContainerDetail from './components/ContainerDetail';
import DeployModal from './components/DeployModal';
import DeployLog from './components/DeployLog';
import ConfirmModal from './components/ConfirmModal';
import type { Container, View } from './types';

interface DeployForm {
  repo: string;
  branch: string;
  name: string;
  ports: { hostPort: string; containerPort: string; protocol: string }[];
  env: { key: string; value: string }[];
}

const API_BASE = '/api';

function App() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [activeDeployId, setActiveDeployId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

  const fetchContainers = async () => {
    try {
      const response = await fetch(`${API_BASE}/containers`);
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContainers();
    setRefreshing(false);
  };

  const executeAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete') {
      return fetch(`${API_BASE}/containers/${id}`, { method: 'DELETE' });
    }
    return fetch(`${API_BASE}/containers/${id}/${action}`, { method: 'POST' });
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    try {
      const response = await executeAction(id, action);
      if (!response.ok) throw new Error('Action failed');
      if (action === 'delete') {
        setContainers((prev) => prev.filter((c) => c.id !== id));
      } else {
        fetchContainers();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error performing action');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleContainerSelect = (id: string) => {
    setSelectedContainerId(id);
    setCurrentView('container-detail');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedContainerId(null);
  };

  const handleDeploy = async (form: DeployForm) => {
    setDeploying(true);
    try {
      const cleanPorts = form.ports
        .filter((p) => p.containerPort)
        .map((p) => ({
          containerPort: parseInt(p.containerPort, 10),
          ...(p.hostPort ? { hostPort: parseInt(p.hostPort, 10) } : {}),
          protocol: p.protocol,
        }));
      const cleanEnv = Object.fromEntries(form.env.filter((e) => e.key).map((e) => [e.key, e.value]));

      const response = await fetch(`${API_BASE}/deploy/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: form.repo,
          branch: form.branch || undefined,
          name: form.name || undefined,
          ports: cleanPorts,
          env: cleanEnv,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Deploy failed');
      setShowDeployModal(false);
      setActiveDeployId(data.deployId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleDeployDone = () => {
    setActiveDeployId(null);
    fetchContainers();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {currentView === 'dashboard' ? 'Dashboard' : 'Container Detail'}
          </h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowDeployModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors text-sm font-medium"
            >
              Deploy
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {refreshing && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {currentView === 'dashboard' && (
          <Dashboard containers={containers} onContainerSelect={handleContainerSelect} />
        )}

        {currentView === 'container-detail' && selectedContainerId && (
          <ContainerDetail
            containerId={selectedContainerId}
            onBack={handleBack}
            onAction={handleAction}
            onDelete={handleDelete}
          />
        )}
      </main>

      {showDeployModal && (
        <DeployModal onDeploy={handleDeploy} onClose={() => setShowDeployModal(false)} loading={deploying} />
      )}

      {activeDeployId && (
        <DeployLog deployId={activeDeployId} onDone={handleDeployDone} />
      )}

      {deleteConfirmId && (
        <ConfirmModal
          title="Delete container?"
          message={`Are you sure you want to delete "${containers.find((c) => c.id === deleteConfirmId)?.name || deleteConfirmId.substring(0, 12)}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            handleAction(deleteConfirmId, 'delete');
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

export default App;
