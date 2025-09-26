// Time formatting utilities

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const target = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diffMs = now - target;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (diffMs < minute) {
    return 'just now';
  }
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `${mins}m ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}h ago`;
  }
  if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `${days}d ago`;
  }
  if (diffMs < month) {
    const weeks = Math.floor(diffMs / week);
    return `${weeks}w ago`;
  }
  
  // For older dates, show actual date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(target);
}

export function formatTimestamp(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(target);
}
