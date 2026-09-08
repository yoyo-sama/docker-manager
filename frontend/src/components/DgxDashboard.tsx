import { ExternalLink } from 'lucide-react';

export default function DgxDashboard() {
  const url = `http://${window.location.hostname}:11000`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end px-6 py-2 border-b border-line bg-surface shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-line text-xs font-medium text-muted hover:text-fg hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20"
        >
          <ExternalLink size={12} strokeWidth={2} />
          Open in a new tab
        </a>
      </div>
      <iframe
        src={url}
        title="DGX Dashboard"
        className="flex-1 w-full border-0 bg-black"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
