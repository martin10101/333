import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contribution } from '@/api/entities';
import { FamilyGoal } from '@/api/entities';
import { User } from '@/api/entities';
import { Check, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function ContributionList({ contributions, getMemberName, getMemberAvatar, onContributionConfirmed, goal }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        // Not logged in
      }
    };
    fetchUser();
  }, []);

  const handleConfirm = async (contribution) => {
    try {
      // Update contribution status
      await Contribution.update(contribution.id, { status: 'confirmed' });
      
      // Update goal's current amount
      const newAmount = goal.current_amount + contribution.amount;
      await FamilyGoal.update(goal.id, { current_amount: newAmount });
      
      toast.success(`Confirmed ${getMemberName(contribution.family_member_id)}'s contribution of $${contribution.amount}!`);
      onContributionConfirmed();

    } catch (error) {
      console.error("Failed to confirm contribution:", error);
      toast.error("Confirmation failed. Please try again.");
    }
  };
  
  const isOrganizer = currentUser && currentUser.id === goal.organizer_id;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Recent Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contributions.length > 0 ? contributions.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getMemberAvatar(c.family_member_id)} />
                  <AvatarFallback>{getMemberName(c.family_member_id).charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getMemberName(c.family_member_id)}</p>
                  <p className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(c.contribution_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">${c.amount.toFixed(2)}</p>
                {c.status === 'pending' ? (
                  isOrganizer ? (
                    <Button onClick={() => handleConfirm(c)} size="sm" className="bg-orange-500 hover:bg-orange-600 h-7 text-xs">
                      <Clock className="w-3 h-3 mr-1.5"/> Confirm
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      <Clock className="w-3 h-3 mr-1.5"/> Pending
                    </Badge>
                  )
                ) : (
                   <Badge variant="secondary" className="bg-green-100 text-green-700">
                     <Check className="w-3 h-3 mr-1.5"/> Confirmed
                   </Badge>
                )}
              </div>
            </motion.div>
          )) : (
            <p className="text-center text-slate-500 py-4">No contributions yet. Be the first to chip in!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}