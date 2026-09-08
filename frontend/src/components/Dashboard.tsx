import { useEffect, useState } from 'react';
import { Boxes, CircuitBoard, Cpu, ExternalLink, HardDrive, MemoryStick } from 'lucide-react';
import StatCard from './StatCard';
import MetricChart from './MetricChart';
import type { SystemMetrics, Container, HistoryPoint } from '../types';

interface Props {
  containers: Container[];
  onContainerSelect: (id: string) => void;
}

function StatusBadge({ running }: { running: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className={running ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
        {running ? 'Running' : 'Stopped'}
      </span>
    </span>
  );
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-fg"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="CPU"
          value={(metrics?.cpu_percent ?? 0).toFixed(1)}
          unit="%"
          color="blue"
          icon={<Cpu size={15} strokeWidth={2} />}
        />
        <StatCard
          title="Memory"
          value={(metrics?.memory_percent ?? 0).toFixed(1)}
          unit="%"
          color="green"
          icon={<MemoryStick size={15} strokeWidth={2} />}
        />
        <StatCard
          title="Disk"
          value={(metrics?.disk_percent ?? 0).toFixed(1)}
          unit="%"
          color="yellow"
          icon={<HardDrive size={15} strokeWidth={2} />}
        />
        <StatCard
          title="GPUs"
          value={metrics?.gpus.length ?? 0}
          color="purple"
          icon={<CircuitBoard size={15} strokeWidth={2} />}
        />
        <StatCard
          title="Containers"
          value={metrics?.container_count ?? 0}
          color="blue"
          icon={<Boxes size={15} strokeWidth={2} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MetricChart title="CPU Usage" data={history} dataKey="cpu" unit="%" color="#0ea5e9" yAxisDomain={[0, 100]} />
        <MetricChart title="Memory Usage" data={history} dataKey="memory" unit="%" color="#10b981" yAxisDomain={[0, 100]} />
      </div>

      {metrics && metrics.gpus.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold tracking-tight mb-3">GPUs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.gpus.map((gpu) => (
              <div key={gpu.index} className="bg-surface rounded-xl p-4 border border-line">
                <h3 className="text-sm font-semibold tracking-tight mb-3 truncate" title={`${gpu.name} (GPU${gpu.index})`}>
                  {gpu.name} <span className="text-muted font-normal">(GPU{gpu.index})</span>
                </h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Util</span>
                    <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
                      {(gpu.utilization_percent ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">VRAM</span>
                    <span className="tabular-nums font-medium text-sky-600 dark:text-sky-400">
                      {gpu.vram_used_mb != null && gpu.vram_total_mb != null
                        ? `${gpu.vram_used_mb.toFixed(0)}/${gpu.vram_total_mb.toFixed(0)} MB`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Temp</span>
                    <span className="tabular-nums font-medium text-red-600 dark:text-red-400">
                      {(gpu.temperature_celsius ?? 0).toFixed(0)}°C
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Power</span>
                    <span className="tabular-nums font-medium text-violet-600 dark:text-violet-400">
                      {(gpu.power_draw_watts ?? 0).toFixed(1)}W
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold tracking-tight mb-3">Containers</h2>
        <div className="overflow-x-auto bg-surface rounded-xl border border-line">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">Name</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">Image</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">Directory</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">URL</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {containers.map((container) => (
                <tr
                  key={container.id}
                  onClick={() => onContainerSelect(container.id)}
                  className="hover:bg-hover transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{container.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-muted">{container.shortId}</span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs font-mono max-w-[220px] truncate" title={container.image}>
                    {container.image}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[260px]">
                    <span className="font-mono text-muted block truncate" title={
                      container.binds.length > 0
                        ? container.binds.map((b) => b.source).join(', ')
                        : container.workingDir
                    }>
                      {container.binds.length > 0
                        ? container.binds.map((b) => b.source).join(', ')
                        : container.workingDir || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {container.running && container.publishedPorts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {container.publishedPorts.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <a
                              href={`http://${window.location.hostname}:${p.hostPort}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              :{p.hostPort}
                              <ExternalLink size={11} strokeWidth={2} />
                            </a>
                            {p.hostNetwork && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                host
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted/50">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge running={container.running} />
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
