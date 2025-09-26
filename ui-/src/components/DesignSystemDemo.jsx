import React from 'react';
import designSystem, { getColor, getTypography, getComponent } from '../design-system';

const DesignSystemDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: getColor('primary.teal') }}>
            {designSystem.brandName} Design System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {designSystem.designPhilosophy}
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(designSystem.colorPalette.primary).map(([name, color]) => (
              <div key={name} className="bg-white rounded-lg p-4 shadow-sm border">
                <div 
                  className="w-full h-16 rounded mb-2" 
                  style={{ backgroundColor: color }}
                ></div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-gray-500">{color}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              className="px-6 py-3 rounded-md font-medium transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: getComponent('buttons.primary.background'),
                color: getComponent('buttons.primary.color'),
                borderRadius: getComponent('buttons.primary.borderRadius'),
                fontSize: getComponent('buttons.primary.fontSize'),
                fontWeight: getComponent('buttons.primary.fontWeight')
              }}
            >
              Primary Button
            </button>
            
            <button 
              className="px-6 py-3 rounded-md font-medium border transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: getComponent('buttons.secondary.background'),
                color: getComponent('buttons.secondary.color'),
                border: getComponent('buttons.secondary.border'),
                borderRadius: getComponent('buttons.secondary.borderRadius'),
                padding: getComponent('buttons.secondary.padding')
              }}
            >
              Secondary Button
            </button>
            
            <button 
              className="px-6 py-3 rounded-md font-medium transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: getComponent('buttons.danger.background'),
                color: getComponent('buttons.danger.color'),
                borderRadius: getComponent('buttons.danger.borderRadius'),
                padding: getComponent('buttons.danger.padding')
              }}
            >
              Danger Button
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Card */}
            <div 
              className="transition-all duration-200 hover:transform hover:-translate-y-2"
              style={{
                background: getComponent('cards.default.background'),
                borderRadius: getComponent('cards.default.borderRadius'),
                padding: getComponent('cards.default.padding'),
                boxShadow: getComponent('cards.default.boxShadow'),
                border: getComponent('cards.default.border')
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Default Card</h3>
              <p className="text-gray-600 mb-4">
                This is a default card with subtle shadow and hover effects.
              </p>
              <button className="text-sm font-medium" style={{ color: getColor('primary.teal') }}>
                Learn More →
              </button>
            </div>

            {/* Featured Card */}
            <div 
              className="transition-all duration-200 hover:transform hover:-translate-y-2"
              style={{
                background: getComponent('cards.featured.background'),
                border: getComponent('cards.featured.border'),
                borderRadius: getComponent('cards.featured.borderRadius'),
                padding: getComponent('cards.featured.padding')
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Featured Card</h3>
              <p className="text-gray-600 mb-4">
                This is a featured card with gradient background and special styling.
              </p>
              <button className="text-sm font-medium" style={{ color: getColor('primary.teal') }}>
                Get Started →
              </button>
            </div>

            {/* Dark Card */}
            <div 
              className="transition-all duration-200 hover:transform hover:-translate-y-2"
              style={{
                background: getComponent('cards.dark.background'),
                color: getComponent('cards.dark.color'),
                borderRadius: getComponent('cards.dark.borderRadius'),
                padding: getComponent('cards.dark.padding')
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Dark Card</h3>
              <p className="text-gray-300 mb-4">
                This is a dark card for highlighting important content.
              </p>
              <button className="text-sm font-medium" style={{ color: getColor('secondary.lightTeal') }}>
                Explore →
              </button>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: getComponent('badges.default.background'),
                color: getComponent('badges.default.color'),
                padding: getComponent('badges.default.padding'),
                borderRadius: getComponent('badges.default.borderRadius'),
                fontSize: getComponent('badges.default.fontSize'),
                fontWeight: getComponent('badges.default.fontWeight')
              }}
            >
              Default
            </span>
            
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: getComponent('badges.success.background'),
                color: getComponent('badges.success.color'),
                padding: getComponent('badges.default.padding'),
                borderRadius: getComponent('badges.default.borderRadius'),
                fontSize: getComponent('badges.default.fontSize'),
                fontWeight: getComponent('badges.default.fontWeight')
              }}
            >
              Success
            </span>
            
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: getComponent('badges.warning.background'),
                color: getComponent('badges.warning.color'),
                padding: getComponent('badges.default.padding'),
                borderRadius: getComponent('badges.default.borderRadius'),
                fontSize: getComponent('badges.default.fontSize'),
                fontWeight: getComponent('badges.default.fontWeight')
              }}
            >
              Warning
            </span>
            
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: getComponent('badges.info.background'),
                color: getComponent('badges.info.color'),
                padding: getComponent('badges.default.padding'),
                borderRadius: getComponent('badges.default.borderRadius'),
                fontSize: getComponent('badges.default.fontSize'),
                fontWeight: getComponent('badges.default.fontWeight')
              }}
            >
              Info
            </span>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Status Indicators</h2>
          <div className="flex flex-wrap gap-6">
            {Object.entries(designSystem.specialElements.statusIndicators).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                ></div>
                <span className="capitalize font-medium">{status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Progress Bars */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Progress Bars</h2>
          <div className="space-y-4">
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress 75%</span>
                <span>3/4 completed</span>
              </div>
              <div 
                className="w-full rounded"
                style={{
                  height: designSystem.specialElements.progressBars.height,
                  background: designSystem.specialElements.progressBars.background,
                  borderRadius: designSystem.specialElements.progressBars.borderRadius
                }}
              >
                <div 
                  className="h-full rounded transition-all duration-300"
                  style={{
                    width: '75%',
                    background: designSystem.specialElements.progressBars.fillColor,
                    borderRadius: designSystem.specialElements.progressBars.borderRadius
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold" style={{ color: getColor('primary.teal') }}>
              Heading 1 - {getTypography('fontSizes.4xl')}
            </h1>
            <h2 className="text-3xl font-semibold" style={{ color: getColor('neutral.darkGray') }}>
              Heading 2 - {getTypography('fontSizes.3xl')}
            </h2>
            <h3 className="text-2xl font-medium" style={{ color: getColor('neutral.darkGray') }}>
              Heading 3 - {getTypography('fontSizes.2xl')}
            </h3>
            <p className="text-lg" style={{ color: getColor('neutral.mediumGray') }}>
              Body Large - {getTypography('fontSizes.lg')} - This is body text with larger size for emphasis.
            </p>
            <p className="text-base" style={{ color: getColor('neutral.darkGray') }}>
              Body Base - {getTypography('fontSizes.base')} - This is the standard body text size for most content.
            </p>
            <p className="text-sm" style={{ color: getColor('neutral.mediumGray') }}>
              Body Small - {getTypography('fontSizes.sm')} - This is smaller text for captions and secondary information.
            </p>
          </div>
        </section>

        {/* Dashboard Widget Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Dashboard Widget</h2>
          <div 
            className="rounded-lg border"
            style={{
              background: designSystem.specialElements.dashboardWidgets.background,
              border: designSystem.specialElements.dashboardWidgets.border,
              borderRadius: designSystem.specialElements.dashboardWidgets.borderRadius,
              padding: designSystem.specialElements.dashboardWidgets.padding
            }}
          >
            <div 
              className="mb-4 pb-3 border-b"
              style={{ background: designSystem.specialElements.dashboardWidgets.headerBackground }}
            >
              <h3 className="text-lg font-semibold">MetaLoop is currently orchestrating:</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('accent.success') }}></div>
                <span>Auto-approving 4 low-risk tools</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('accent.warning') }}></div>
                <span>Coordinating Audit Agent for FDA policy change</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('accent.info') }}></div>
                <span>Learning from last week's compliance events</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemDemo; 