import React from 'react'

export interface LiveGovernanceStreamProps {
  isOpen: boolean
  onClose: () => void
  position?: 'left' | 'right'
  context?: any
  currentUser?: any
}

export interface UseLiveGovernanceStreamReturn {
  isStreamOpen: boolean
  setIsStreamOpen: (open: boolean) => void
  streamContext: any
  openStream: (context?: any) => void
}

export const LiveGovernanceStream: React.FC<LiveGovernanceStreamProps>
export const useLiveGovernanceStream: () => UseLiveGovernanceStreamReturn
export default LiveGovernanceStream
