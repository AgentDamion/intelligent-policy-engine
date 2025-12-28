import { Sparkles } from 'lucide-react'
import { Button } from '../ui/button'

export interface VeraLauncherProps {
  onOpen: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export default function VeraLauncher({
  onOpen,
  variant = 'outline',
  size = 'sm',
  label = 'Ask VERA',
  className = '',
}: VeraLauncherProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onOpen}
      className={`flex items-center gap-2 ${className}`}
    >
      <Sparkles className="h-4 w-4 text-indigo-600" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}








