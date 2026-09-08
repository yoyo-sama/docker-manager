import { useEffect, useRef, useState } from 'react';

interface LogEntry {
  type: string;
  text: string;
  time?: string;
}

interface Props {
  deployId: string;
  onDone: () => void;
}

export default function DeployLog({ deployId, onDone }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string>('running');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/events/deploy/${deployId}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        setStatus(data.text);
        if (data.text !== 'running') {
          es.close();
        }
      } else {
        setLogs(prev => [...prev, data]);
      }
    };

    es.onerror = () => {
      setStatus('error');
      es.close();
    };

    return () => es.close();
  }, [deployId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = async () => {
    const text = logs.map(l => l.text).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] mx-4 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Deploy logs</h2>
            <span className={`text-sm ${statusColor}`}>
              {status === 'running' && 'In progress...'}
              {status === 'success' && 'Completed'}
              {status === 'error' && 'Failed'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 rounded text-sm transition-colors"
            >
              {copied ? 'Copied!' : 'Copy logs'}
            </button>
            <button onClick={onDone} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {logs.length === 0 && status === 'running' && (
            <div className="text-gray-500">Waiting for logs...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'cmd' ? 'text-yellow-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'info' ? 'text-blue-300' :
              'text-gray-300'
            }`}>
              {log.text}
            </div>
          ))}
          {status === 'running' && (
            <div className="inline-flex items-center gap-1.5 text-gray-500 mt-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Running...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
