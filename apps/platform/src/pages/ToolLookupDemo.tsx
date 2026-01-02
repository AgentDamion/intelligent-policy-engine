import React, { useState, useEffect } from 'react'
import { SurfaceLayout } from '../components/SurfaceLayout'
import { EdgeCard } from '../components/ui/edge-card'
import { AICOMPLYRButton } from '../components/ui/aicomplyr-button'
import { Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/status-badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Checkbox } from '../components/ui/Checkbox'
import { ToolCard } from '../components/tools/ToolCard'
import { designTokens } from '../lib/design-tokens'

// Mock data for demo screens
const DEMO_SCREENS = [
  { id: 'search', label: 'Search' },
  { id: 'analyzing', label: 'Analyzing' },
  { id: 'category-ok', label: 'Category OK' },
  { id: 'restricted', label: 'Restricted' },
  { id: 'unknown', label: 'Unknown' },
  { id: 'session-start', label: 'Session Start' },
  { id: 'active', label: 'Active' },
  { id: 'session-end', label: 'Session End' },
  { id: 'review', label: 'Review' },
  { id: 'request', label: 'Request' },
  { id: 'multi-client', label: 'Multi-Client' },
] as const

type ScreenId = typeof DEMO_SCREENS[number]['id']

interface ToolData {
  name: string
  status: 'approved' | 'conditional' | 'denied' | 'unknown' | 'pending'
  statusLabel: string
  directoryNote: string
  category: string
  vendor: string
  dataHandling: string
  riskTier: string
  policyName: string
  policyText: string
  systemStatus: {
    policyEngine: 'Active' | 'Inactive'
    proofLayer: 'Capturing' | 'Paused'
    humanAccountability: 'Enforced' | 'Disabled'
  }
  options: Array<{
    id: string
    title: string
    description: string
    recommended?: boolean
  }>
}

const MOCK_TOOL: ToolData = {
  name: 'Runway ML',
  status: 'unknown',
  statusLabel: 'UNKNOWN',
  directoryNote: 'Not yet in Pfizer directory',
  category: 'Video Generation',
  vendor: 'Runway AI, Inc. (San Francisco, CA)',
  dataHandling: 'Cloud processing, optional training',
  riskTier: 'Medium (visual content generation)',
  policyName: "PFIZER'S VIDEO GENERATION POLICY",
  policyText: '"AI-generated video content requires: pre-approval of concept by brand team, human review of all generated frames, no depiction of real patients, HCPs, or medical procedures, disclosure of AI involvement in asset metadata."',
  systemStatus: {
    policyEngine: 'Active',
    proofLayer: 'Capturing',
    humanAccountability: 'Enforced',
  },
  options: [
    {
      id: 'proceed',
      title: 'Proceed Under Category Policy',
      description: "Use Runway now under Pfizer's video generation rules. You'll need to meet policy requirements and complete human review attestation for outputs.",
      recommended: true,
    },
    {
      id: 'request',
      title: 'Request Formal Approval',
      description: 'Submit Runway ML for formal review and inclusion in the approved tool directory.',
    },
  ],
}

// System Status Bar Component
const SystemStatusBar: React.FC = () => (
  <EdgeCard>
    <div className="p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 pb-2 border-b border-neutral-200">
        SYSTEM STATUS
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-600">Policy Engine:</span>
          <span className="text-sm font-semibold text-status-approved">{MOCK_TOOL.systemStatus.policyEngine}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-600">Proof Layer:</span>
          <span className="text-sm font-semibold text-status-escalated">{MOCK_TOOL.systemStatus.proofLayer}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-600">Human Accountability:</span>
          <span className="text-sm font-semibold text-aicomplyr-black">{MOCK_TOOL.systemStatus.humanAccountability}</span>
        </div>
      </div>
    </div>
  </EdgeCard>
)

export default function ToolLookupDemo() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedProject, setSelectedProject] = useState('')
  const [attestations, setAttestations] = useState({
    conceptApproval: false,
    humanReview: false,
    noRealPeople: false,
    brandGuidelines: false,
    aiDisclosure: false,
  })
  const [outputType, setOutputType] = useState('')

  // Navigation helper
  const goTo = (screen: ScreenId) => {
    setCurrentScreen(screen)
    if (screen === 'analyzing') {
      setAnalysisProgress(0)
    }
  }

  // Simulate analysis progress
  useEffect(() => {
    if (currentScreen === 'analyzing' && analysisProgress < 100) {
      const timer = setTimeout(() => {
        setAnalysisProgress(prev => Math.min(prev + 20, 100))
      }, 400)
      return () => clearTimeout(timer)
    }
    if (analysisProgress === 100 && currentScreen === 'analyzing') {
      setTimeout(() => goTo('category-ok'), 500)
    }
  }, [currentScreen, analysisProgress])

  // Screen: Tool Search
  const SearchScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Tool Lookup
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Check tool eligibility for your current workspace
      </p>

      <div className="space-y-6">
        <Input
          placeholder="Search for an AI tool..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-2 border-neutral-200 focus:border-aicomplyr-black rounded-none"
        />

        {searchQuery.length > 2 && (
          <EdgeCard>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge variant="pending">UNKNOWN</StatusBadge>
                <span className="text-sm text-neutral-600">
                  "{searchQuery}" is not in the Pfizer AI Tool Directory
                </span>
              </div>
              <AICOMPLYRButton onClick={() => goTo('analyzing')}>
                Analyze Tool →
              </AICOMPLYRButton>
            </div>
          </EdgeCard>
        )}

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Recently Used
          </div>
          <div className="space-y-0 border border-neutral-200">
            <ToolCard
              tool={{ name: 'Claude 3.5 Sonnet', category: 'Text Generation' }}
              status="approved"
            />
            <ToolCard
              tool={{ name: 'Midjourney v6', category: 'Image Generation' }}
              status="conditional"
            />
            <ToolCard
              tool={{ name: 'Sora', category: 'Video Generation' }}
              status="denied"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Screen: Analyzing Tool
  const AnalyzingScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Analyzing Tool
      </h1>

      <EdgeCard>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: designTokens.colors.black,
                color: designTokens.colors.yellow,
              }}
            >
              ANALYZING
            </span>
            <span className="text-base font-semibold">
              Runway ML
            </span>
          </div>

          <div className="mb-6">
            <ProgressBar progress={analysisProgress} />
          </div>

          <div className="text-sm text-neutral-600 space-y-2">
            {analysisProgress >= 25 && (
              <div className="text-status-approved">✓ Tool identified: Runway ML</div>
            )}
            {analysisProgress >= 50 && (
              <div className="text-status-approved">✓ Category detected: Video Generation</div>
            )}
            {analysisProgress >= 75 && (
              <div className="text-status-approved">✓ Vendor: Runway AI, Inc.</div>
            )}
            {analysisProgress < 100 && (
              <div className="text-neutral-500">
                {analysisProgress < 25 && '○ Identifying tool...'}
                {analysisProgress >= 25 && analysisProgress < 50 && '○ Detecting category...'}
                {analysisProgress >= 50 && analysisProgress < 75 && '○ Checking vendor information...'}
                {analysisProgress >= 75 && '○ Matching against directory...'}
              </div>
            )}
            {analysisProgress >= 100 && (
              <div className="text-status-approved">✓ Analysis complete</div>
            )}
          </div>
        </div>
      </EdgeCard>
    </div>
  )

  // Screen: Category Available
  const CategoryAvailableScreen: React.FC = () => (
    <div className="max-w-5xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        {MOCK_TOOL.name}
      </h1>
      <div className="flex items-center gap-3 mb-8">
        <StatusBadge variant="pending">UNKNOWN</StatusBadge>
        <span className="text-sm text-neutral-500">{MOCK_TOOL.directoryNote}</span>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="col-span-2 space-y-6">
          <EdgeCard>
            <div className="p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
                TOOL ANALYSIS
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-24 text-sm text-neutral-500">Category:</span>
                  <span className="text-sm font-medium text-aicomplyr-black">{MOCK_TOOL.category}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-neutral-500">Vendor:</span>
                  <span className="text-sm font-medium text-aicomplyr-black">{MOCK_TOOL.vendor}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-neutral-500">Data:</span>
                  <span className="text-sm font-medium text-aicomplyr-black">{MOCK_TOOL.dataHandling}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-neutral-500">Risk tier:</span>
                  <span className="text-sm font-medium text-aicomplyr-black">{MOCK_TOOL.riskTier}</span>
                </div>
              </div>
            </div>
          </EdgeCard>

          <EdgeCard variant="selected">
            <div className="p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {MOCK_TOOL.policyName}
              </div>
              <p className="text-sm text-neutral-700 italic leading-relaxed border-l-2 border-l-neutral-200 pl-4">
                {MOCK_TOOL.policyText}
              </p>
            </div>
          </EdgeCard>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
              YOUR OPTIONS
            </div>
            <div className="space-y-3">
              {MOCK_TOOL.options.map((option) => (
                <EdgeCard
                  key={option.id}
                  variant={option.recommended ? 'selected' : 'default'}
                >
                  <div
                    className="p-5 flex items-start justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => option.id === 'proceed' ? goTo('session-start') : goTo('request')}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {option.recommended && (
                          <span className="text-status-approved">✓</span>
                        )}
                        <h4 className="text-sm font-semibold text-aicomplyr-black">
                          {option.title}
                        </h4>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    <span className="text-neutral-400 ml-4">→</span>
                  </div>
                </EdgeCard>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <SystemStatusBar />
        </div>
      </div>
    </div>
  )

  // Screen: Category Restricted
  const CategoryRestrictedScreen: React.FC = () => (
    <div className="max-w-3xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        {MOCK_TOOL.name}
      </h1>
      <div className="flex items-center gap-3 mb-8">
        <StatusBadge variant="denied">DENIED</StatusBadge>
        <span className="text-sm text-neutral-500">Restricted category for Novartis</span>
      </div>

      <EdgeCard variant="attention">
        <div className="p-6">
          <div className="text-base font-semibold mb-4 flex items-center gap-2">
            <span className="text-status-escalated">⚠</span>
            Video Generation is Restricted for Novartis
          </div>
          <div className="text-sm text-neutral-700 leading-relaxed mb-4">
            <strong>Novartis policy (effective Sept 2024):</strong><br />
            "AI-generated video content is not approved for any patient-facing or HCP-facing materials at this time. Internal use cases may be considered on exception."
          </div>
          <div className="text-xs text-neutral-400">
            Policy owner: Global Digital Compliance<br />
            Last updated: September 15, 2024
          </div>
        </div>
      </EdgeCard>

      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          YOUR OPTIONS
        </div>
        <div className="space-y-3">
          <EdgeCard>
            <div className="p-5 cursor-pointer hover:bg-neutral-50">
              <h4 className="text-sm font-semibold mb-2">Request Exception</h4>
              <p className="text-sm text-neutral-600 mb-3">
                Request approval for this specific use case. Timeline: 5-10 business days (requires client review).
              </p>
              <p className="text-xs text-neutral-400">💡 Exceptions are more likely approved for internal-only use cases.</p>
            </div>
          </EdgeCard>
          <EdgeCard>
            <div className="p-5 cursor-pointer hover:bg-neutral-50">
              <h4 className="text-sm font-semibold mb-2">Discuss with Your Account Team</h4>
              <p className="text-sm text-neutral-600">Account lead: Jennifer Walsh</p>
            </div>
          </EdgeCard>
        </div>
      </div>
    </div>
  )

  // Screen: Truly Unknown
  const TrulyUnknownScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Tool Not Recognized
      </h1>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-base font-semibold mb-3 flex items-center gap-2">
            <span className="text-neutral-400">?</span>
            We don't recognize "Quantum Content AI"
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            This tool isn't in our database. This could mean it's very new, niche or specialized, or the name might be different than expected.
          </p>
        </div>
      </EdgeCard>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          HELP US CLASSIFY THIS TOOL
        </div>

        <EdgeCard>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tool website</label>
              <Input placeholder="https://quantumcontent.ai" className="border-2 border-neutral-200 focus:border-aicomplyr-black rounded-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">What does this tool do?</label>
              <div className="space-y-2">
                {[
                  'Text generation / writing assistance',
                  'Image generation / editing',
                  'Video generation / editing',
                  'Audio generation / editing',
                  'Code generation / assistance',
                  'Data analysis / insights',
                ].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="category" className="w-4 h-4" />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">How will you use it on this project?</label>
              <textarea
                className="w-full h-20 p-3 border-2 border-neutral-200 focus:border-aicomplyr-black focus:outline-none rounded-none resize-y"
                placeholder="Describe your use case..."
              />
            </div>

            <AICOMPLYRButton>Submit for Review</AICOMPLYRButton>

            <p className="text-xs text-neutral-400">Expected response time: 1-2 business days</p>
          </div>
        </EdgeCard>
      </div>
    </div>
  )

  // Screen: Proceed Session
  const ProceedSessionScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Proceeding with Runway ML
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Using under Pfizer's Video Generation policy
      </p>

      <EdgeCard variant="selected">
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-5">
            REQUIREMENTS FOR THIS SESSION
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-3 border-2 border-neutral-200 focus:border-aicomplyr-black focus:outline-none rounded-none bg-white"
            >
              <option value="">Select project...</option>
              <option value="eliquis">Eliquis Q4 HCP Campaign</option>
              <option value="jardiance">Jardiance Launch Assets</option>
              <option value="brand">Corporate Brand Refresh</option>
            </select>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={attestations.conceptApproval}
              onChange={(v) => setAttestations(prev => ({ ...prev, conceptApproval: v }))}
              label="I have concept pre-approval from the brand team"
            />
            <Checkbox
              checked={attestations.humanReview}
              onChange={(v) => setAttestations(prev => ({ ...prev, humanReview: v }))}
              label="I understand AI-generated content requires human review before use in final deliverables"
            />
          </div>
        </div>
      </EdgeCard>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            WHAT WE'LL TRACK
          </div>
          <div className="text-sm text-neutral-600 space-y-1 mb-4">
            <div>• Tool: Runway ML</div>
            <div>• Session start time</div>
            <div>• Project association</div>
            <div>• Your attestation that requirements are met</div>
          </div>
          <div className="pt-4 border-t border-neutral-200 text-sm text-neutral-400">
            <strong>We do NOT capture:</strong>
            <div>• Your prompts or inputs (unless you opt in)</div>
            <div>• Generated content (unless you save to project)</div>
            <div>• Screen recordings or keystrokes</div>
          </div>
        </div>
      </EdgeCard>

      <div className="flex gap-3">
        <AICOMPLYRButton
          disabled={!selectedProject || !attestations.conceptApproval || !attestations.humanReview}
          onClick={() => goTo('active')}
        >
          Begin Session
        </AICOMPLYRButton>
        <AICOMPLYRButton variant="secondary-light" onClick={() => goTo('category-ok')}>
          Cancel
        </AICOMPLYRButton>
      </div>
    </div>
  )

  // Screen: Session Active
  const SessionActiveScreen: React.FC = () => (
    <div className="max-w-md mx-auto">
      <EdgeCard variant="selected">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-semibold">Runway Session Active</div>
            <div className="w-2 h-2 bg-status-approved rounded-full animate-pulse" />
          </div>

          <div className="text-sm text-neutral-600 space-y-1 mb-4">
            <div><strong>Project:</strong> Eliquis Q4 HCP Campaign</div>
            <div><strong>Policy:</strong> Video Generation (Pfizer)</div>
            <div><strong>Started:</strong> 2:34 PM</div>
          </div>

          <div className="p-4 bg-neutral-100 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              REMEMBER
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div>• No real patients or HCPs</div>
              <div>• Human review required before use</div>
              <div>• Add AI disclosure to metadata</div>
            </div>
          </div>

          <div className="flex gap-2">
            <AICOMPLYRButton variant="secondary" onClick={() => goTo('session-end')} className="flex-1">
              End Session
            </AICOMPLYRButton>
            <AICOMPLYRButton variant="secondary-light" className="flex-1">
              Save Output
            </AICOMPLYRButton>
          </div>
        </div>
      </EdgeCard>
    </div>
  )

  // Screen: Session End
  const SessionEndScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        End Runway Session
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Session duration: 47 minutes
      </p>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-sm font-semibold mb-4">
            Did you create content for this project?
          </div>

          <div className="space-y-3">
            {[
              { value: 'used', label: 'Yes, I generated content I plan to use' },
              { value: 'discarded', label: 'Yes, but I decided not to use the outputs' },
              { value: 'exploration', label: 'No, this was exploration/testing only' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 cursor-pointer p-3 border-2 transition-colors ${
                  outputType === option.value
                    ? 'border-aicomplyr-black bg-neutral-100'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="outputType"
                  value={option.value}
                  checked={outputType === option.value}
                  onChange={(e) => setOutputType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </EdgeCard>

      {outputType === 'used' && (
        <EdgeCard variant="selected">
          <div className="p-6 mb-6">
            <div className="text-sm font-semibold mb-2">Save Outputs for Human Review</div>
            <p className="text-sm text-neutral-600 mb-4">
              Per Pfizer policy, AI-generated video content requires human review before inclusion in deliverables.
            </p>

            <div className="border-2 border-dashed border-neutral-200 p-8 text-center mb-4">
              <div className="text-sm text-neutral-600 mb-1">
                Drag files here or click to upload
              </div>
              <div className="text-xs text-neutral-400">
                Supported: MP4, MOV, GIF, PNG sequence
              </div>
            </div>

            <Checkbox
              checked={false}
              onChange={() => {}}
              label="I'll upload later (reminder will be sent)"
            />
          </div>
        </EdgeCard>
      )}

      <AICOMPLYRButton onClick={() => outputType === 'used' ? goTo('review') : goTo('search')}>
        {outputType === 'used' ? 'Continue to Review' : 'Complete Session'}
      </AICOMPLYRButton>
    </div>
  )

  // Screen: Human Review
  const HumanReviewScreen: React.FC = () => (
    <div className="max-w-3xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Human Review Required
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Runway outputs from Eliquis Q4 Campaign
      </p>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            OUTPUTS TO REVIEW
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'header_v1.mp4', duration: '12 sec' },
              { name: 'transition.mp4', duration: '4 sec' },
            ].map((file) => (
              <div key={file.name} className="border border-neutral-200 p-4">
                <div className="w-full h-20 bg-neutral-100 flex items-center justify-center mb-3">
                  <span className="text-2xl text-neutral-400">▶</span>
                </div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-neutral-400">{file.duration} • Runway ML</div>
              </div>
            ))}
          </div>
        </div>
      </EdgeCard>

      <EdgeCard variant="selected">
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-5">
            REVIEW CHECKLIST
          </div>

          <p className="text-sm mb-5">
            I, <strong>Marcus Johnson</strong>, attest that I have reviewed each output above and confirm:
          </p>

          <div className="space-y-4">
            <Checkbox
              checked={attestations.noRealPeople}
              onChange={(v) => setAttestations(prev => ({ ...prev, noRealPeople: v }))}
              label="No real patients, HCPs, or identifiable individuals"
            />
            <Checkbox
              checked={attestations.brandGuidelines}
              onChange={(v) => setAttestations(prev => ({ ...prev, brandGuidelines: v }))}
              label="Brand guidelines followed (colors, typography, style)"
            />
            <Checkbox
              checked={attestations.aiDisclosure}
              onChange={(v) => setAttestations(prev => ({ ...prev, aiDisclosure: v }))}
              label="AI disclosure will be added to asset metadata"
            />
          </div>
        </div>
      </EdgeCard>

      <p className="text-sm text-neutral-600 mb-5">
        By clicking "Attest & Approve", I confirm this creates an audit-ready record of my review decision.
      </p>

      <div className="flex gap-3">
        <AICOMPLYRButton
          variant="primary-yellow"
          disabled={!attestations.noRealPeople || !attestations.brandGuidelines || !attestations.aiDisclosure}
          onClick={() => goTo('search')}
        >
          Attest & Approve
        </AICOMPLYRButton>
        <AICOMPLYRButton variant="secondary-light">
          Flag for Further Review
        </AICOMPLYRButton>
      </div>
    </div>
  )

  // Screen: Request Approval
  const RequestApprovalScreen: React.FC = () => (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        Request Tool Approval
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Add Runway ML to Pfizer's AI Tool Directory
      </p>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            TOOL INFORMATION
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-24 text-neutral-500">Tool name:</span>
              <span className="font-medium">Runway ML</span>
            </div>
            <div className="flex">
              <span className="w-24 text-neutral-500">Vendor:</span>
              <span>Runway AI, Inc.</span>
            </div>
            <div className="flex">
              <span className="w-24 text-neutral-500">Website:</span>
              <span>runwayml.com</span>
            </div>
            <div className="flex">
              <span className="w-24 text-neutral-500">Category:</span>
              <span>Video Generation (auto-detected)</span>
            </div>
          </div>
        </div>
      </EdgeCard>

      <EdgeCard>
        <div className="p-6 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            YOUR USE CASE
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">How do you plan to use this tool?</label>
              <textarea
                className="w-full h-20 p-3 border-2 border-neutral-200 focus:border-aicomplyr-black focus:outline-none rounded-none resize-y"
                placeholder="Creating short animated transitions and motion graphics for HCP email campaigns..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Which projects will use this tool?</label>
              <div className="space-y-2">
                <Checkbox checked={true} onChange={() => {}} label="Eliquis Q4 HCP Campaign" />
                <Checkbox checked={false} onChange={() => {}} label="Jardiance Launch Assets" />
                <Checkbox checked={true} onChange={() => {}} label="General ongoing use across Pfizer work" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Expected frequency of use</label>
              <div className="space-y-2">
                {[
                  'One-time / single project',
                  'Ongoing / multiple projects',
                  'Experimental / evaluating',
                ].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="frequency" className="w-4 h-4" />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </EdgeCard>

      <div className="p-4 bg-neutral-100 mb-6 text-sm text-neutral-600">
        💡 Requests with supporting documentation (security docs, DPAs) are typically approved 40% faster.
      </div>

      <AICOMPLYRButton>Submit Request</AICOMPLYRButton>

      <p className="text-xs text-neutral-400 mt-4">Expected response: 3-5 business days</p>
    </div>
  )

  // Screen: Multi-Client
  const MultiClientScreen: React.FC = () => (
    <div className="max-w-3xl mx-auto">
      <h1
        className="text-3xl mb-2"
        style={{ fontFamily: designTokens.fonts.display }}
      >
        {MOCK_TOOL.name}
      </h1>
      <div className="flex items-center gap-3 mb-8">
        <StatusBadge variant="conditional">CONDITIONAL</StatusBadge>
        <span className="text-sm text-neutral-500">Client-specific policies apply</span>
      </div>

      <p className="text-sm text-neutral-600 mb-6">
        Your clients have different policies for this tool:
      </p>

      <div className="space-y-4 mb-6">
        <EdgeCard variant="selected">
          <div className="p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-semibold">Pfizer</span>
              <StatusBadge variant="conditional" />
            </div>
            <div className="text-sm text-neutral-600 space-y-1">
              <div>• Human review required</div>
              <div>• No real people</div>
              <div>• Enterprise plan only</div>
            </div>
          </div>
        </EdgeCard>

        <EdgeCard variant="attention">
          <div className="p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-semibold">Novartis</span>
              <StatusBadge variant="denied" />
            </div>
            <div className="text-sm text-neutral-600 mb-3">
              Video generation blocked for all external materials
            </div>
            <AICOMPLYRButton variant="secondary-light" className="text-xs py-1.5 px-3">
              Request Exception
            </AICOMPLYRButton>
          </div>
        </EdgeCard>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          SELECT PROJECT TO CONTINUE
        </div>
        <select
          className="w-full p-3 border-2 border-neutral-200 focus:border-aicomplyr-black focus:outline-none rounded-none bg-white mb-4"
        >
          <option value="">Select project...</option>
          <option value="pfizer">Eliquis Q4 HCP Campaign (Pfizer)</option>
          <option value="pfizer2">Jardiance Launch Assets (Pfizer)</option>
          <option disabled>─────────────</option>
          <option disabled>Novartis projects unavailable</option>
        </select>
        <p className="text-sm text-neutral-400">
          You can only proceed with Runway for Pfizer projects. For Novartis projects, see approved alternatives.
        </p>
      </div>
    </div>
  )

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'search':
        return <SearchScreen />
      case 'analyzing':
        return <AnalyzingScreen />
      case 'category-ok':
        return <CategoryAvailableScreen />
      case 'restricted':
        return <CategoryRestrictedScreen />
      case 'unknown':
        return <TrulyUnknownScreen />
      case 'session-start':
        return <ProceedSessionScreen />
      case 'active':
        return <SessionActiveScreen />
      case 'session-end':
        return <SessionEndScreen />
      case 'review':
        return <HumanReviewScreen />
      case 'request':
        return <RequestApprovalScreen />
      case 'multi-client':
        return <MultiClientScreen />
      default:
        return <SearchScreen />
    }
  }

  return (
    <SurfaceLayout
      surface="lab"
      title="Tool Lookup"
      subtitle="Check tool eligibility for your workspace"
    >
      <div className="max-w-7xl mx-auto">
        {/* Prototype Screens Navigation */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            PROTOTYPE SCREENS:
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMO_SCREENS.map((screen) => (
              <button
                key={screen.id}
                onClick={() => goTo(screen.id)}
                className={`px-4 py-2 text-sm font-medium border-2 transition-colors ${
                  currentScreen === screen.id
                    ? 'bg-aicomplyr-black text-white border-aicomplyr-black'
                    : 'bg-white text-aicomplyr-black border-aicomplyr-black hover:bg-neutral-50'
                }`}
                style={{ borderRadius: 0 }}
              >
                {screen.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render current screen */}
        {renderScreen()}
      </div>
    </SurfaceLayout>
  )
}
