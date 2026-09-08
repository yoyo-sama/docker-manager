import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface Props {
  containerId: string;
}

export default function Terminal({ containerId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      theme: {
        background: '#111827',
        foreground: '#e5e7eb',
        cursor: '#a78bfa',
        selectionBackground: '#4c1d95',
      },
      convertEol: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/exec/${containerId}`);

    let disposed = false;

    const sendResize = () => {
      try {
        fitAddon.fit();
      } catch {
        /* ignore */
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    const handleResize = () => {
      if (!disposed) sendResize();
    };

    ws.onopen = () => {
      term.focus();
      sendResize();
    };

    ws.onmessage = (event) => {
      if (disposed) return;
      if (typeof event.data === 'string') {
        term.write(event.data);
      } else {
        event.data.arrayBuffer().then((buf: ArrayBuffer) => term.write(new Uint8Array(buf)));
      }
    };

    ws.onclose = () => {
      if (!disposed) {
        term.write('\r\n[connection closed]\r\n');
      }
    };

    ws.onerror = () => {
      if (!disposed) {
        term.write('\r\n[connection error]\r\n');
      }
    };

    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      dataDisposable.dispose();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      term.dispose();
    };
  }, [containerId]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="bg-gray-900 rounded-md overflow-hidden"
        style={{ height: '380px' }}
      />
      <p className="text-xs text-gray-500 mt-1">Interactive shell inside the container.</p>
    </div>
  );
}