import { useState } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Deploy from GitHub</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">GitHub Repository *</label>
            <input
              type="text"
              value={form.repo}
              onChange={e => updateField('repo', e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
              <input
                type="text"
                value={form.branch}
                onChange={e => updateField('branch', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Container Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="(auto-generated)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-300">Port Mappings</label>
              <button type="button" onClick={addPort} className="text-xs text-blue-400 hover:text-blue-300">+ Add port</button>
            </div>
            {form.ports.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <input
                  type="number"
                  placeholder="Host port"
                  value={p.hostPort}
                  onChange={e => updatePort(i, 'hostPort', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                />
                <span className="text-gray-500 pb-2">:</span>
                <input
                  type="number"
                  placeholder="Container port"
                  value={p.containerPort}
                  onChange={e => updatePort(i, 'containerPort', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                />
                <select
                  value={p.protocol}
                  onChange={e => updatePort(i, 'protocol', e.target.value)}
                  className="px-2 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                >
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
                {form.ports.length > 1 && (
                  <button type="button" onClick={() => removePort(i)} className="text-red-400 hover:text-red-300 pb-2">&times;</button>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-300">Environment Variables</label>
              <button type="button" onClick={addEnv} className="text-xs text-blue-400 hover:text-blue-300">+ Add variable</button>
            </div>
            {form.env.map((e, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <input
                  type="text"
                  placeholder="KEY"
                  value={e.key}
                  onChange={val => updateEnv(i, 'key', val.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm font-mono"
                />
                <input
                  type="text"
                  placeholder="VALUE"
                  value={e.value}
                  onChange={val => updateEnv(i, 'value', val.target.value)}
                  className="flex-[2] px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm font-mono"
                />
                {form.env.length > 1 && (
                  <button type="button" onClick={() => removeEnv(i)} className="text-red-400 hover:text-red-300 pb-2">&times;</button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.repo}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 rounded text-sm transition-colors flex items-center gap-2"
            >
              {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Deploy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
