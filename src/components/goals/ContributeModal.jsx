import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/api/entities';
import { Contribution } from '@/api/entities';
import { X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContributeModal({ goal, onClose, onContributionMade }) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter amount, 2: Confirmation

  const handlePledge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setStep(2);
  };

  const handleConfirmSent = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      await Contribution.create({
        goal_id: goal.id,
        family_member_id: user.id,
        amount: parseFloat(amount),
        contribution_date: new Date().toISOString()
      });

      toast.success(`Your $${amount} pledge has been recorded! Waiting for confirmation.`);
      onContributionMade();
    } catch (error) {
      console.error("Failed to record contribution:", error);
      toast.error("Could not record your pledge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Chip in for "{goal.title}"</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-slate-600">How much would you like to contribute to this goal?</p>
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Input
                        id="amount"
                        type="number"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="50.00"
                        className="pl-7 text-lg"
                    />
                </div>
              </div>
              <Button onClick={handlePledge} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold">Ready to send ${amount}?</h3>
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-slate-600 mb-2">Please send the money to the organizer using their preferred method:</p>
                <p className="text-lg font-bold text-blue-600 bg-blue-100 px-4 py-2 rounded-lg inline-block">
                  {goal.organizer_payment_info}
                </p>
              </div>
              <p className="text-sm text-slate-500">After you've sent the money, click below to notify the family that your contribution is on its way!</p>
              <Button onClick={handleConfirmSent} className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 
                <> <Send className="w-4 h-4 mr-2"/> I've Sent the Money! </>}
              </Button>
               <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                Go Back
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}