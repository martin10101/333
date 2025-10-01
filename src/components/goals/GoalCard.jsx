import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';

export default function GoalCard({ goal, onPlanTrip }) {
  const progressPercentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const isFullyFunded = progressPercentage >= 100;

  return (
    <Card className="rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden group transition-all duration-300 hover:shadow-green-200 hover:scale-105">
      <div className="relative">
        <img 
          src={goal.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop'} 
          alt={goal.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-bold text-white shadow-md">{goal.title}</h3>
          <p className="text-sm text-slate-200 shadow-sm">{goal.description}</p>
        </div>
        {isFullyFunded && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
            <Plane className="w-4 h-4" />
            Fully Funded!
          </div>
        )}
      </div>
      <div className="p-4 bg-white">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-green-600">
            ${goal.current_amount.toLocaleString()}
          </span>
          <span className="text-sm text-slate-500">
            Target: ${goal.target_amount.toLocaleString()}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-blue-500" />
        <p className="text-right text-xs text-slate-500 mt-1">
          {Math.round(progressPercentage)}% Funded
        </p>
        
        {isFullyFunded && (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              onPlanTrip(goal);
            }}
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plane className="w-4 h-4 mr-2" />
            Plan Your Trip!
          </Button>
        )}
      </div>
    </Card>
  );
}