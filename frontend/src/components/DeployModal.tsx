import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PortMapping {
  hostPort: string;
  containerPort: string;
  protocol: string;
}

interface DeployForm {
  repo: string;
  branch: string;
  name: string;
  ports: PortMapping[];
  env: { key: string; value: string }[];
}

interface Props {
  onDeploy: (form: DeployForm) => void;
  onClose: () => void;
  loading: boolean;
}

const inputClass =
  'w-full px-3 h-9 bg-base border border-line rounded-lg text-sm placeholder:text-muted/60 focus:outline-none focus:border-fg/30 focus:ring-2 focus:ring-fg/10 transition-colors';

export default function DeployModal({ onDeploy, onClose, loading }: Props) {
  const [form, setForm] = useState<DeployForm>({
    repo: '',
    branch: 'main',
    name: '',
    ports: [{ hostPort: '', containerPort: '', protocol: 'tcp' }],
    env: [{ key: '', value: '' }],
  });

  const updateField = <K extends keyof DeployForm>(key: K, value: DeployForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updatePort = (i: number, key: keyof PortMapping, value: string) =>
    setForm(prev => {
      const ports = [...prev.ports];
      ports[i] = { ...ports[i], [key]: value };
      return { ...prev, ports };
    });

  const addPort = () =>
    setForm(prev => ({ ...prev, ports: [...prev.ports, { hostPort: '', containerPort: '', protocol: 'tcp' }] }));

  const removePort = (i: number) =>
    setForm(prev => ({ ...prev, ports: prev.ports.filter((_, idx) => idx !== i) }));

  const updateEnv = (i: number, key: keyof { key: string; value: string }, value: string) =>
    setForm(prev => {
      const env = [...prev.env];
      env[i] = { ...env[i], [key]: value };
      return { ...prev, env };
    });

  const addEnv = () =>
    setForm(prev => ({ ...prev, env: [...prev.env, { key: '', value: '' }] }));

  const removeEnv = (i: number) =>
    setForm(prev => ({ ...prev, env: prev.env.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.repo) return;
    onDeploy(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Deploy from GitHub">
      <div className="bg-elevated border border-line rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="px-6 h-16 border-b border-line flex justify-between items-center sticky top-0 bg-elevated z-10">
          <h2 className="text-base font-semibold tracking-tight">Deploy from GitHub</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-muted hover:text-fg hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="deploy-repo">GitHub Repository *</label>
            <input
              id="deploy-repo"
              type="text"
              value={form.repo}
              onChange={e => updateField('repo', e.target.value)}
              placeholder="https://github.com/user/repo"
              className={inputClass}
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" htmlFor="deploy-branch">Branch</label>
              <input
                id="deploy-branch"
                type="text"
                value={form.branch}
                onChange={e => updateField('branch', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" htmlFor="deploy-name">Container Name</label>
              <input
                id="deploy-name"
                type="text"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="(auto-generated)"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Port Mappings</label>
              <button
                type="button"
                onClick={addPort}
                className="text-xs font-medium text-muted hover:text-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20 rounded px-1"
              >
                + Add port
              </button>
            </div>
            {form.ports.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  type="number"
                  placeholder="Host port"
                  value={p.hostPort}
                  onChange={e => updatePort(i, 'hostPort', e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <span className="text-muted text-sm">:</span>
                <input
                  type="number"
                  placeholder="Container port"
                  value={p.containerPort}
                  onChange={e => updatePort(i, 'containerPort', e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <select
                  value={p.protocol}
                  onChange={e => updatePort(i, 'protocol', e.target.value)}
                  className={`${inputClass} w-24 shrink-0`}
                >
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
                {form.ports.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePort(i)}
                    aria-label={`Remove port ${i + 1}`}
                    className="w-8 h-9 shrink-0 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  >
                    <span className="text-xl leading-none">&times;</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Environment Variables</label>
              <button
                type="button"
                onClick={addEnv}
                className="text-xs font-medium text-muted hover:text-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20 rounded px-1"
              >
                + Add variable
              </button>
            </div>
            {form.env.map((e, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder="KEY"
                  value={e.key}
                  onChange={val => updateEnv(i, 'key', val.target.value)}
                  className={`${inputClass} flex-1 font-mono`}
                />
                <input
                  type="text"
                  placeholder="VALUE"
                  value={e.value}
                  onChange={val => updateEnv(i, 'value', val.target.value)}
                  className={`${inputClass} flex-[2] font-mono`}
                />
                {form.env.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEnv(i)}
                    aria-label={`Remove variable ${i + 1}`}
                    className="w-8 h-9 shrink-0 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  >
                    <span className="text-xl leading-none">&times;</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-line text-sm font-medium hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.repo}
              className="px-4 h-9 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Deploy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
