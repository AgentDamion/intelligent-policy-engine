import { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { DEMO_SCENARIOS, DEFAULT_SCENARIO_ID } from '@/data/demoScenarios';
import { PlaybackSpeed } from '@/types/intelligenceDemo';
import { DemoControls } from './DemoControls';
import { DemoScenarioSelector } from './DemoScenarioSelector';
import { DemoStageIndicator } from './DemoStageIndicator';
import { DemoAgentActivity } from './DemoAgentActivity';
import { DemoDecisionPanel } from './DemoDecisionPanel';
import { DemoProofPanel } from './DemoProofPanel';
import { DemoMetricsOverlay } from './DemoMetricsOverlay';
import { DemoNarrative } from './DemoNarrative';
import { DemoCallToAction } from './DemoCallToAction';
import { DemoIntro } from './DemoIntro';
import { trackDemoEvent, DemoEvents } from '@/utils/demoTelemetry';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const IntelligenceDemoLayout = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>(DEFAULT_SCENARIO_ID);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [showNarrative, setShowNarrative] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const scenario = DEMO_SCENARIOS[selectedScenario];
  const stage = scenario.stages[currentStage];
  const isFirstStage = currentStage === 0;
  const isLastStage = currentStage === scenario.stages.length - 1;

  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setTimeout(() => {
      if (currentStage < scenario.stages.length - 1) {
        setCurrentStage(prev => prev + 1);
        trackDemoEvent(DemoEvents.DEMO_STAGE_CHANGED, {
          scenario_id: selectedScenario,
          stage_id: stage.id,
          stage_index: currentStage + 1,
        });
      } else {
        setIsPlaying(false);
        trackDemoEvent(DemoEvents.DEMO_COMPLETED, {
          scenario_id: selectedScenario,
          duration: Date.now() - startTime,
          completion_rate: 100,
        });
      }
    }, stage.duration / playbackSpeed);
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStage, playbackSpeed, scenario.stages.length, stage, selectedScenario, startTime]);

  // Track demo start
  useEffect(() => {
    if (isPlaying && currentStage === 0) {
      setStartTime(Date.now());
      trackDemoEvent(DemoEvents.DEMO_STARTED, {
        scenario_id: selectedScenario,
      });
    }
  }, [isPlaying, currentStage, selectedScenario]);

  // Keyboard shortcuts
  useHotkeys('space', () => {
    setIsPlaying(!isPlaying);
    trackDemoEvent(isPlaying ? DemoEvents.DEMO_PAUSED : DemoEvents.DEMO_RESUMED, {
      scenario_id: selectedScenario,
      stage_id: stage.id,
      stage_index: currentStage,
    });
  }, { preventDefault: true });

  useHotkeys('right', () => {
    if (currentStage < scenario.stages.length - 1) {
      setCurrentStage(prev => prev + 1);
      trackDemoEvent(DemoEvents.DEMO_STAGE_SKIPPED, {
        from_stage: currentStage,
        to_stage: currentStage + 1,
      });
    }
  });

  useHotkeys('left', () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
      trackDemoEvent(DemoEvents.DEMO_STAGE_SKIPPED, {
        from_stage: currentStage,
        to_stage: currentStage - 1,
      });
    }
  });

  useHotkeys('r', () => {
    setCurrentStage(0);
    setIsPlaying(false);
    trackDemoEvent(DemoEvents.DEMO_REPLAYED, {
      scenario_id: selectedScenario,
    });
  });

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setCurrentStage(0);
    setIsPlaying(false);
    trackDemoEvent(DemoEvents.DEMO_SCENARIO_CHANGED, {
      from_scenario: selectedScenario,
      to_scenario: scenarioId,
    });
  };

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    trackDemoEvent(DemoEvents.DEMO_SPEED_CHANGED, {
      from_speed: playbackSpeed,
      to_speed: speed,
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    trackDemoEvent(isPlaying ? DemoEvents.DEMO_PAUSED : DemoEvents.DEMO_RESUMED, {
      scenario_id: selectedScenario,
      stage_id: stage.id,
      stage_index: currentStage,
    });
  };

  const handlePrevious = () => {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
      trackDemoEvent(DemoEvents.DEMO_STAGE_SKIPPED, {
        from_stage: currentStage,
        to_stage: currentStage - 1,
      });
    }
  };

  const handleNext = () => {
    if (currentStage < scenario.stages.length - 1) {
      setCurrentStage(prev => prev + 1);
      trackDemoEvent(DemoEvents.DEMO_STAGE_SKIPPED, {
        from_stage: currentStage,
        to_stage: currentStage + 1,
      });
    }
  };

  const handleStageSelect = (stageIndex: number) => {
    setCurrentStage(stageIndex);
    trackDemoEvent(DemoEvents.DEMO_STAGE_SKIPPED, {
      from_stage: currentStage,
      to_stage: stageIndex,
    });
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      // Get current user for membership linking
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('seed-globalmed', {
        body: { user_id: user?.id }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Seeding failed');

      toast.success('GlobalMed data seeded successfully!', {
        description: `${data.stats.middlewareRequests} requests, ${data.stats.violations} violations in ${data.duration}s`
      });
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed GlobalMed data', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-0">
      {/* Data Seeding Section */}
      <div className="border-b border-ink-100 bg-surface-50 px-s4 py-s3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink-900">Demo Data Management</h3>
            <p className="text-[12px] text-ink-500 mt-s1">
              Seed GlobalMed ONCAVEX-Persado scenario with 430 middleware requests, policies, and violations
            </p>
          </div>
          <Button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-s2 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-s2" />
                Seed GlobalMed Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header with controls and scenario selector */}
      <div className="border-b border-ink-100 bg-surface-0 px-s4 py-s3 space-y-s3">
        <div className="flex items-center justify-between">
          <DemoScenarioSelector
            scenarios={DEMO_SCENARIOS}
            selectedScenario={selectedScenario}
            onScenarioChange={handleScenarioChange}
          />
          <DemoControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPrevious={handlePrevious}
            onNext={handleNext}
            playbackSpeed={playbackSpeed}
            onSpeedChange={handleSpeedChange}
            canGoPrevious={!isFirstStage}
            canGoNext={!isLastStage}
            showNarrative={showNarrative}
            onToggleNarrative={() => {
              setShowNarrative(!showNarrative);
              trackDemoEvent(DemoEvents.DEMO_NARRATIVE_TOGGLED, {
                visible: !showNarrative,
              });
            }}
          />
        </div>
        
        {/* Stage indicator */}
        <DemoStageIndicator
          stages={scenario.stages}
          currentStage={currentStage}
          onStageSelect={handleStageSelect}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          {stage.type === 'intro' && stage.content.intro && (
            <DemoIntro intro={stage.content.intro} scenario={scenario} />
          )}
          
          {stage.type === 'conversation' && stage.content.messages && (
            <DemoAgentActivity
              messages={stage.content.messages}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
            />
          )}
          
          {stage.type === 'decision' && stage.content.decision && (
            <DemoDecisionPanel decision={stage.content.decision} />
          )}
          
          {stage.type === 'proof' && stage.content.proof && (
            <DemoProofPanel proof={stage.content.proof} />
          )}
          
          {stage.type === 'outcome' && stage.content.metrics && (
            <DemoMetricsOverlay
              metrics={stage.content.metrics}
              isActive={isPlaying || isLastStage}
            />
          )}
        </div>

        {/* Narrative sidebar */}
        {showNarrative && stage.narrative && (
          <DemoNarrative content={stage.narrative} />
        )}
      </div>

      {/* CTA footer (only on last stage) */}
      {isLastStage && <DemoCallToAction />}
    </div>
  );
};
