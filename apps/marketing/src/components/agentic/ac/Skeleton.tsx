export const ThreadListSkeleton = () => (
  <div className="p-s2 space-y-s2" role="status" aria-label="Loading threads">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-[80px] rounded-r2 border border-ink-100 p-s3 animate-pulse">
        <div className="h-[16px] bg-ink-100 rounded-r1 mb-s2 w-3/4" />
        <div className="h-[12px] bg-ink-100 rounded-r1 w-1/2" />
      </div>
    ))}
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex gap-s3" role="status" aria-label="Loading messages">
    <div className="w-[28px] h-[28px] rounded-full bg-ink-100 animate-pulse shrink-0" />
    <div className="flex-1 space-y-s2">
      <div className="h-[12px] bg-ink-100 animate-pulse rounded-r1 w-1/4" />
      <div className="h-[20px] bg-ink-100 animate-pulse rounded-r1" />
      <div className="h-[20px] bg-ink-100 animate-pulse rounded-r1 w-5/6" />
    </div>
  </div>
);

export const TypingIndicator = () => (
  <div className="flex gap-s3 items-center pl-[36px]" aria-live="polite">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-ink-500 text-[12px] font-mono">Agent is thinking</span>
  </div>
);
