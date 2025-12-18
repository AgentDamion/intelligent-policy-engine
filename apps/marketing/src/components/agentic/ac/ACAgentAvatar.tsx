import { clsx } from 'clsx';

interface ACAgentAvatarProps {
  initial: string;
  size?: number;
  type?: 'agent' | 'human';
}

export const ACAgentAvatar = ({ initial, size = 28, type = 'agent' }: ACAgentAvatarProps) => {
  return (
    <div
      data-agent-avatar
      data-type={type}
      className={clsx(
        'rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0',
        type === 'agent' ? 'bg-ink-800 text-white' : 'bg-ink-200 text-ink-900'
      )}
      style={{ width: size, height: size }}
    >
      {initial.charAt(0).toUpperCase()}
    </div>
  );
};
