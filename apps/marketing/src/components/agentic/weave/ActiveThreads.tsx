import { ThreadListItem } from './ThreadListItem';

interface Thread {
  id: string;
  title: string;
  pills: { label: string; kind?: 'agent' | 'human' | 'status' | 'fact' }[];
  meta: string;
  status: string;
  participantCount: number;
}

interface ActiveThreadsProps {
  threads: Thread[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ActiveThreads = ({ threads, selectedId, onSelect }: ActiveThreadsProps) => {
  return (
    <div role="list" className="flex-1 overflow-y-auto p-s2">
      {threads.map((thread) => (
        <div key={thread.id} className="mb-s1" role="presentation">
          <ThreadListItem
            {...thread}
            active={selectedId === thread.id}
            onClick={() => onSelect(thread.id)}
          />
        </div>
      ))}
      
      {threads.length === 0 && (
        <div className="flex items-center justify-center h-full text-ink-500 text-[12px] font-mono">
          No active threads
        </div>
      )}
    </div>
  );
};
