import { Play, Pause, SkipBack, SkipForward, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaybackSpeed } from '@/types/intelligenceDemo';

interface DemoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  playbackSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  showNarrative: boolean;
  onToggleNarrative: () => void;
}

export const DemoControls = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  playbackSpeed,
  onSpeedChange,
  canGoPrevious,
  canGoNext,
  showNarrative,
  onToggleNarrative,
}: DemoControlsProps) => {
  return (
    <div className="flex items-center gap-s2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        title="Previous stage (←)"
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onPlayPause}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!canGoNext}
        title="Next stage (→)"
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
        title="Restart demo (R)"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-ink-200" />

      <Select
        value={playbackSpeed.toString()}
        onValueChange={(value) => onSpeedChange(parseFloat(value) as PlaybackSpeed)}
      >
        <SelectTrigger className="w-[100px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">0.5x</SelectItem>
          <SelectItem value="1">1x</SelectItem>
          <SelectItem value="1.5">1.5x</SelectItem>
          <SelectItem value="2">2x</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleNarrative}
        title="Toggle narrative"
      >
        {showNarrative ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
};
