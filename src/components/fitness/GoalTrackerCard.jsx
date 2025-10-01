import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift } from 'lucide-react';

export default function GoalTrackerCard({ goal, member }) {
  const progressPercentage = (goal.current_value / goal.target_value) * 100;

  return (
    <Card className="rounded-2xl shadow-md shadow-slate-200/50 border-slate-200/60">
      <CardHeader>
        <div className="flex items-center gap-3">
           <Avatar className="w-10 h-10">
              <AvatarImage src={member?.avatar_url} />
              <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold text-slate-600 text-sm">{member?.name}'s Goal</p>
                <CardTitle className="text-lg text-slate-900">{goal.title}</CardTitle>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mb-2">
            <p className="text-2xl font-bold text-green-600">{goal.current_value}<span className="text-lg text-slate-500 font-medium">/{goal.target_value} {goal.unit}</span></p>
        </div>
        <Progress value={progressPercentage} className="h-3 [&>div]:bg-green-500" />
        
        {goal.reward_pledges && goal.reward_pledges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
                 <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-500" />
                    Pledged Rewards
                </h4>
                <div className="space-y-1">
                    {goal.reward_pledges.map((pledge, i) => (
                        <div key={i} className="text-sm text-slate-600">
                             <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{pledge.reward_value}</span> pledged by Dad
                        </div>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}