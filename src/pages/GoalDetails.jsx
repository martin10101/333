
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FamilyGoal } from '@/api/entities';
import { Contribution } from '@/api/entities';
import { FamilyMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Calendar, Target, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';

import ContributeModal from '../components/goals/ContributeModal';
import ContributionList from '../components/goals/ContributionList';
import GoalJar3D from '../components/goals/GoalJar3D'; // Import the new 3D component

export default function GoalDetailsPage() {
  const location = useLocation();
  const [goal, setGoal] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);

  const goalId = new URLSearchParams(location.search).get('id');

  const loadData = useCallback(async () => {
    if (!goalId) return;
    setIsLoading(true);
    try {
      const [goalData, contributionData, memberData] = await Promise.all([
        FamilyGoal.get(goalId),
        Contribution.filter({ goal_id: goalId }, '-contribution_date'),
        FamilyMember.list()
      ]);
      setGoal(goalData);
      setContributions(contributionData);
      setMembers(memberData);
    } catch (error) {
      console.error("Failed to load goal details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [goalId]); 

  useEffect(() => {
    loadData();
  }, [loadData]); 

  if (isLoading) {
    return <div className="text-center p-12">Loading goal details...</div>;
  }

  if (!goal) {
    return <div className="text-center p-12">Goal not found.</div>;
  }

  const progressPercentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const daysLeft = goal.due_date ? format(new Date(goal.due_date), 'dd MMM yyyy') : 'N/A';

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'A family member';
  const getMemberAvatar = (id) => members.find(m => m.id === id)?.avatar_url;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 mb-8">
            <img 
              src={goal.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop'} 
              alt={goal.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <h1 className="text-4xl font-bold drop-shadow-lg">{goal.title}</h1>
              <p className="text-lg text-slate-200 drop-shadow-md">{goal.description}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-start">
            <h2 className="text-2xl font-bold mb-4">Goal Progress</h2>
            <div className="w-full h-64 md:h-80 -mt-4 md:-mt-8">
              <GoalJar3D progress={progressPercentage / 100} />
            </div>
            <div className="flex justify-between items-end w-full mt-4">
                <span className="text-2xl md:text-4xl font-bold text-green-600">${goal.current_amount.toLocaleString()}</span>
                <span className="text-base md:text-lg text-slate-500">of ${goal.target_amount.toLocaleString()}</span>
            </div>
             <div className="w-full mt-2">
                <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                <div className="flex justify-between text-sm mt-1">
                    <span className="font-semibold">{Math.round(progressPercentage)}% Funded</span>
                    <Button onClick={() => setShowContributeModal(true)} size="sm" className="bg-green-500 hover:bg-green-600 rounded-lg -mt-1">
                        <Plus className="h-4 w-4 mr-1"/>Chip In
                    </Button>
                </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full"><Target className="w-6 h-6 text-blue-600"/></div>
                <div>
                    <p className="text-sm text-slate-500">Goal</p>
                    <p className="font-bold text-lg">${goal.target_amount.toLocaleString()}</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full"><Calendar className="w-6 h-6 text-red-600"/></div>
                <div>
                    <p className="text-sm text-slate-500">Due Date</p>
                    <p className="font-bold text-lg">{daysLeft}</p>
                </div>
            </div>
          </div>
        </div>

        <ContributionList 
          contributions={contributions} 
          getMemberName={getMemberName}
          getMemberAvatar={getMemberAvatar}
          onContributionConfirmed={loadData}
          goal={goal}
        />
      </motion.div>

      {showContributeModal && (
        <ContributeModal 
          goal={goal}
          onClose={() => setShowContributeModal(false)}
          onContributionMade={() => {
            setShowContributeModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
