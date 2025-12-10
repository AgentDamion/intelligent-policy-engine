import { ACChatWidget } from '../ac/ACChatWidget'
import { useEnterprise } from '../../../contexts/EnterpriseContext'

interface SpineLayoutProps {
  children?: React.ReactNode
}

export function SpineLayout({ children }: SpineLayoutProps) {
  const { currentEnterprise } = useEnterprise()

  return (
    <div className="relative h-full">
      {/* Main content area */}
      {children && (
        <div className="h-full">
          {children}
        </div>
      )}

      {/* Floating Chat Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-96 h-[600px]">
          <ACChatWidget enterpriseId={currentEnterprise?.id} />
        </div>
      </div>
    </div>
  )
}

