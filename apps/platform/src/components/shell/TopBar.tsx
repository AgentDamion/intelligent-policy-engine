import React from 'react'
import { Menu, Search, Sparkles } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/button'

export interface TopBarProps {
  enterpriseName?: string
  onOpenSidebar?: () => void
  onOpenVera?: () => void
}

export const TOPBAR_HEIGHT_CLASS = 'h-14' // 56px

export default function TopBar({ enterpriseName, onOpenSidebar, onOpenVera }: TopBarProps) {
  return (
    <div className={`sticky top-0 z-30 bg-white border-b border-gray-200 ${TOPBAR_HEIGHT_CLASS}`}>
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        {/* Mobile: open sidebar */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Open navigation"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global search placeholder */}
        <div className="flex-1 hidden md:block max-w-xl ml-4">
          <Input
            placeholder="Search threads, decisions, policies..."
            leadingIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVera}
            className="flex items-center gap-2 h-9 border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-slate-900" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">VERA</span>
          </Button>
        </div>
      </div>
    </div>
  )
}


