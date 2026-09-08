const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

function getHostMetrics() {
  const cpus = os.cpus();
  const total = cpus.reduce((s, c) => s + c.times.user + c.times.nice + c.times.sys + c.times.idle, 0);
  const idle = cpus.reduce((s, c) => s + c.times.idle, 0);
  const cpu = cpus.length > 0 ? ((total - idle) / total) * 100 : 0;
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const mem = ((memTotal - memFree) / memTotal) * 100;
  return {
    cpu_percent: cpu,
    memory_total_bytes: memTotal,
    memory_used_bytes: memTotal - memFree,
    memory_percent: mem,
    uptime_seconds: os.uptime(),
  };
}

function getDiskMetrics() {
  try {
    const out = execSync('df -B1 /').toString();
    const parts = out.split('\n')[1].split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    return {
      disk_total_bytes: total,
      disk_used_bytes: used,
      disk_percent: (used / total) * 100,
    };
  } catch {
    return { disk_total_bytes: 0, disk_used_bytes: 0, disk_percent: 0 };
  }
}

function getGpuMetrics() {
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  try {
    const out = execSync(
      'nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw --format=csv,noheader,nounits'
    ).toString();
    return out
      .trim()
      .split('\n')
      .map((line) => {
        const [index, name, util, memUsed, memTotal, temp, power] = line.split(',').map((s) => s.trim());
        return {
          index: parseInt(index),
          name,
          utilization_percent: num(util),
          vram_used_mb: num(memUsed),
          vram_total_mb: num(memTotal),
          temperature_celsius: num(temp),
          power_draw_watts: num(power),
        };
      });
  } catch {
    return [];
  }
}

function getGpuMemoryByContainer() {
  const map = new Map();
  try {
    const out = execSync(
      'nvidia-smi --query-compute-apps=pid,used_memory --format=csv,noheader,nounits'
    ).toString();
    for (const line of out.trim().split('\n').filter(Boolean)) {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length < 2) continue;
      const pid = parseInt(parts[0], 10);
      const memMiB = parseFloat(parts[1]);
      if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(memMiB)) continue;
      let cgroup;
      try {
        cgroup = fs.readFileSync(`/proc/${pid}/cgroup`, 'utf8');
      } catch {
        continue;
      }
      let m = cgroup.match(/docker-([a-f0-9]{64})\.scope/);
      if (!m) m = cgroup.match(/docker[\/\\]([a-f0-9]{64})/);
      if (!m) continue;
      const id = m[1];
      map.set(id, (map.get(id) || 0) + Math.round(memMiB * 1024 * 1024));
    }
  } catch {
    return new Map();
  }
  return map;
}

function getContainerStats(stats) {
  const cpuTotal = stats.cpu_stats?.cpu_usage?.total_usage || 0;
  const systemTotal = stats.cpu_stats?.system_cpu_usage || 1;
  const cpuPercent = (cpuTotal / systemTotal) * 100;

  const memUsage = stats.memory_stats?.usage || 0;
  const memLimit = stats.memory_stats?.limit || 1;
  const memPercent = (memUsage / memLimit) * 100;

  const networks = stats.networks || {};
  const netRx = Object.values(networks).reduce((sum, n) => sum + (n.rx_bytes || 0), 0);
  const netTx = Object.values(networks).reduce((sum, n) => sum + (n.tx_bytes || 0), 0);

  const blkio = stats.blkio_stats?.io_service_bytes || [];
  let blockRead = 0;
  let blockWrite = 0;
  for (const entry of blkio) {
    for (const val of entry.values) {
      if (entry.op === 'Read') blockRead += val;
      else if (entry.op === 'Write') blockWrite += val;
    }
  }

  return {
    cpu_percent: cpuPercent,
    memory_usage_bytes: memUsage,
    memory_percent: memPercent,
    network_rx_bytes: netRx,
    network_tx_bytes: netTx,
    block_read_bytes: blockRead,
    block_write_bytes: blockWrite,
  };
}

module.exports = { getHostMetrics, getDiskMetrics, getGpuMetrics, getGpuMemoryByContainer, getContainerStats };
