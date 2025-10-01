import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FamilyGoal } from '@/api/entities';
import { FamilyTrip } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Target } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GoalCard from '../components/goals/GoalCard';
import { toast } from 'sonner';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGoals = async () => {
      setIsLoading(true);
      try {
        const goalData = await FamilyGoal.list('-created_date');
        setGoals(goalData);
      } catch (error) {
        console.error("Failed to load goals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGoals();
  }, []);

  const handlePlanTrip = async (goal) => {
    try {
      // Check if trip already exists for this goal
      const existingTrips = await FamilyTrip.filter({ goal_id: goal.id });
      
      if (existingTrips.length > 0) {
        // Navigate to existing trip
        navigate(createPageUrl(`TravelPlanning?id=${existingTrips[0].id}`));
      } else {
        // Create new trip
        const newTrip = await FamilyTrip.create({
          goal_id: goal.id,
          destination: goal.title,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'planning',
          participants: [],
          budget: {
            total: goal.current_amount,
            spent: 0,
            categories: {}
          }
        });
        
        toast.success('Trip planning activated! 🎉');
        navigate(createPageUrl(`TravelPlanning?id=${newTrip.id}`));
      }
    } catch (error) {
      console.error("Failed to create trip:", error);
      toast.error('Failed to start trip planning');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Family Vault
          </h1>
          <p className="text-slate-600 mt-1">Work together to achieve your family's biggest dreams!</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 rounded-2xl shadow-lg shadow-green-500/20">
          <Plus className="mr-2 h-5 w-5" />
          New Goal
        </Button>
      </motion.div>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading your family's goals...</p>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={createPageUrl(`GoalDetails?id=${goal.id}`)}>
                <GoalCard goal={goal} onPlanTrip={handlePlanTrip} />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center p-12 border-2 border-dashed">
            <Target className="w-16 h-16 mx-auto text-slate-300 mb-4"/>
            <h3 className="text-xl font-semibold text-slate-800">No Goals Yet</h3>
            <p className="text-slate-500 mt-2 mb-6">Create your first family goal and start saving together.</p>
            <Button className="bg-green-500 hover:bg-green-600">Create First Goal</Button>
        </Card>
      )}
    </div>
  );
}