import React from 'react'
import { VERAOrb } from '../components/vera/VERAOrb'

/**
 * Standalone VERA Orb page - showcases the interactive VERA Orb
 * that opens VERA Chat when clicked
 */
export default function VERAOrbPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <VERAOrb className="w-full aspect-square" />
      </div>
    </div>
  )
}

