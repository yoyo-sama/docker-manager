import { useEffect, useState } from 'react';
import StatCard from './StatCard';
import MetricChart from './MetricChart';
import Terminal from './Terminal';
import type { ContainerDetail, ContainerStats, ContainerHistoryPoint } from '../types';

interface Props {
  containerId: string;
  onBack: () => void;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  onDelete: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ContainerDetail({ containerId, onBack, onAction, onDelete }: Props) {
  const [container, setContainer] = useState<ContainerDetail | null>(null);
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [history, setHistory] = useState<ContainerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailRes, statsRes] = await Promise.all([
          fetch(`/api/containers/${containerId}`),
          fetch(`/api/containers/${containerId}/stats`),
        ]);
        const detailData = await detailRes.json();
        const statsData = await statsRes.json();
        setContainer(detailData);
        setStats(statsData);
        if (!detailData.running) {
          setShowTerminal(false);
        }
        setHistory((prev) => [
          ...prev.slice(-59),
          {
            time: new Date().toISOString(),
            ...statsData,
          },
        ]);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [containerId]);

  if (loading && !container) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!container) return null;

  const ports = container.ports
    ? Object.entries(container.ports)
        .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Array.isArray(entry[1]))
        .flatMap(([portKey, mappings]) =>
          mappings.map((m) => `${m.HostIp || '0.0.0.0'}:${m.HostPort || ''}->${portKey}`)
        )
    : [];

  return (
    <div className="p-8 overflow-y-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white text-sm flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">{container.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="CPU" value={(stats?.cpu_percent ?? 0).toFixed(1)} unit="%" color="blue" />
        <StatCard
          title="Memory (CPU + GPU)"
          value={formatBytes(stats?.memory_usage_combined ?? 0)}
          unit={` (${(stats?.memory_percent_combined ?? 0).toFixed(1)}%)`}
          subtitle={`CPU ${formatBytes(stats?.memory_usage_bytes ?? 0)} · GPU ${formatBytes(stats?.vram_usage_bytes ?? 0)}`}
          color="green"
        />
        <StatCard title="Network RX" value={formatBytes(stats?.network_rx_bytes ?? 0)} color="yellow" />
        <StatCard title="Network TX" value={formatBytes(stats?.network_tx_bytes ?? 0)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MetricChart
          title="CPU Usage"
          data={history}
          dataKey="cpu_percent"
          unit="%"
          color="#3b82f6"
          yAxisDomain={[0, 100]}
        />
        <MetricChart
          title="Memory Usage (CPU + GPU)"
          data={history}
          dataKey="memory_percent_combined"
          unit="%"
          color="#22c55e"
          yAxisDomain={[0, 100]}
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-3">Container Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Image:</span>
            <span className="ml-2 text-gray-300">{container.image}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-2 text-gray-300">{container.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Restart Policy:</span>
            <span className="ml-2 text-gray-300">{container.restartPolicy || 'none'}</span>
          </div>
          <div>
            <span className="text-gray-400">Started:</span>
            <span className="ml-2 text-gray-300">{new Date(container.startedAt).toLocaleString()}</span>
          </div>
          {ports.length > 0 && (
            <div>
              <span className="text-gray-400">Ports:</span>
              <div className="ml-2 text-gray-300">
                {ports.map((p, i) => (
                  <div key={i}>{p}</div>
                ))}
              </div>
            </div>
          )}
          {container.command && container.command.length > 0 && (
            <div>
              <span className="text-gray-400">Command:</span>
              <span className="ml-2 text-gray-300 font-mono">{container.command.join(' ')}</span>
            </div>
          )}
        </div>
      </div>

      {container.running && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Terminal</h2>
            <button
              onClick={() => setShowTerminal((prev) => !prev)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
            >
              {showTerminal ? 'Hide terminal' : 'Open terminal'}
            </button>
          </div>
          {showTerminal && <Terminal containerId={containerId} />}
        </div>
      )}

      <div className="flex gap-3">
        {container.running ? (
          <>
            <button
              onClick={() => onAction(containerId, 'stop')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm transition-colors"
            >
              Stop
            </button>
            <button
              onClick={() => onAction(containerId, 'restart')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              Restart
            </button>
          </>
        ) : (
          <button
            onClick={() => onAction(containerId, 'start')}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
          >
            Start
          </button>
        )}
        <button
          onClick={() => onDelete(containerId)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
