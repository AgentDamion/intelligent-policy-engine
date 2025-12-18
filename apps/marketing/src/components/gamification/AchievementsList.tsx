import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Achievement } from '@/types/gamification';

interface AchievementsListProps {
  achievements: Achievement[];
  compact?: boolean;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({ 
  achievements, 
  compact = false 
}) => {
  const unlocked = achievements.filter(a => a.unlockedAt);
  const locked = achievements.filter(a => !a.unlockedAt);

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {unlocked.slice(0, 5).map((achievement) => (
          <Badge key={achievement.id} variant="secondary" className="gap-1">
            <span>{achievement.icon}</span>
            <span className="text-xs">{achievement.name}</span>
          </Badge>
        ))}
        {unlocked.length > 5 && (
          <Badge variant="outline">+{unlocked.length - 5} more</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Achievements</CardTitle>
          </div>
          <Badge variant="secondary">
            {unlocked.length} / {achievements.length}
          </Badge>
        </div>
        <CardDescription>Track your compliance journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Unlocked</h4>
            {unlocked.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Locked</h4>
            {locked.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 opacity-60">
                <div className="text-2xl grayscale">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-muted-foreground">{achievement.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.progress !== undefined && achievement.target !== undefined && (
                    <div className="mt-2 space-y-1">
                      <Progress value={(achievement.progress / achievement.target) * 100} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {achievement.progress} / {achievement.target}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
