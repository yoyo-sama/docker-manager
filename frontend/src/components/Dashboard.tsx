import { useEffect, useState } from 'react';
import StatCard from './StatCard';
import MetricChart from './MetricChart';
import type { SystemMetrics, Container, HistoryPoint } from '../types';

interface Props {
  containers: Container[];
  onContainerSelect: (id: string) => void;
}

export default function Dashboard({ containers, onContainerSelect }: Props) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const sysRes = await fetch('/api/system');
        const sysData = await sysRes.json();
        setMetrics(sysData);
        setHistory((prev) => [
          ...prev.slice(-59),
          {
            time: new Date().toISOString(),
            cpu: sysData.cpu_percent,
            memory: sysData.memory_percent,
            disk: sysData.disk_percent,
          },
        ]);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="CPU" value={(metrics?.cpu_percent ?? 0).toFixed(1)} unit="%" color="blue" />
        <StatCard title="Memory" value={(metrics?.memory_percent ?? 0).toFixed(1)} unit="%" color="green" />
        <StatCard title="Disk" value={(metrics?.disk_percent ?? 0).toFixed(1)} unit="%" color="yellow" />
        <StatCard title="GPUs" value={metrics?.gpus.length ?? 0} color="purple" />
        <StatCard title="Containers" value={metrics?.container_count ?? 0} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MetricChart title="CPU Usage" data={history} dataKey="cpu" unit="%" color="#3b82f6" yAxisDomain={[0, 100]} />
        <MetricChart title="Memory Usage" data={history} dataKey="memory" unit="%" color="#22c55e" yAxisDomain={[0, 100]} />
      </div>

      {metrics && metrics.gpus.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">GPUs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.gpus.map((gpu) => (
              <div key={gpu.index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold mb-2">
                  {gpu.name} (GPU{gpu.index})
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Util: <span className="text-yellow-400">{(gpu.utilization_percent ?? 0).toFixed(1)}%</span>
                  </div>
                  <div>
                    VRAM:{' '}
                    <span className="text-blue-400">
                      {gpu.vram_used_mb != null && gpu.vram_total_mb != null
                        ? `${gpu.vram_used_mb.toFixed(0)}/${gpu.vram_total_mb.toFixed(0)} MB`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    Temp: <span className="text-red-400">{(gpu.temperature_celsius ?? 0).toFixed(0)}°C</span>
                  </div>
                  <div>
                    Power: <span className="text-purple-400">{(gpu.power_draw_watts ?? 0).toFixed(1)}W</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Containers</h2>
        <div className="overflow-x-auto bg-gray-800 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-700/50">
              <tr className="border-b border-gray-700">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Image</th>
                <th className="p-4 font-semibold">Directory</th>
                <th className="p-4 font-semibold">URL</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {containers.map((container) => (
                <tr
                  key={container.id}
                  onClick={() => onContainerSelect(container.id)}
                  className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <span className="text-blue-400 font-medium">{container.name}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">{container.shortId}</span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{container.image}</td>
                  <td className="p-4 text-gray-300 text-sm">
                    <span className="font-mono">
                      {container.binds.length > 0
                        ? container.binds.map((b) => b.source).join(', ')
                        : container.workingDir || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {container.running && container.publishedPorts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {container.publishedPorts.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <a
                              href={`http://${window.location.hostname}:${p.hostPort}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-purple-400 hover:text-purple-300 underline break-all"
                            >
                              :{p.hostPort}
                            </a>
                            {p.hostNetwork && (
                              <span className="px-1 rounded bg-purple-900/60 text-purple-300 text-[10px] font-semibold uppercase">
                                host
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        container.running ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {container.running ? 'Running' : 'Stopped'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
