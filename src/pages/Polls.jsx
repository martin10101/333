import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FamilyPoll } from '@/api/entities';
import { FamilyMember } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Vote, Trophy, Clock, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import CreatePollModal from '../components/polls/CreatePollModal';
import PollCard from '../components/polls/PollCard';

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pollData, memberData, user] = await Promise.all([
        FamilyPoll.list('-created_date'),
        FamilyMember.list(),
        User.me()
      ]);
      setPolls(pollData);
      setMembers(memberData);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!currentUser) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      if (poll.status === 'closed') {
        toast.error('This poll is closed');
        return;
      }

      // Check if user already voted
      const userVoted = poll.options.some(option => 
        option.votes?.some(vote => vote.user_id === currentUser.id)
      );

      if (userVoted && !poll.allow_multiple_votes) {
        // Remove previous vote
        const updatedOptions = poll.options.map(option => ({
          ...option,
          votes: option.votes?.filter(vote => vote.user_id !== currentUser.id) || []
        }));
        poll.options = updatedOptions;
      }

      // Add new vote
      const newVote = {
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        timestamp: new Date().toISOString()
      };

      const updatedOptions = poll.options.map((option, idx) => {
        if (idx === optionIndex) {
          return {
            ...option,
            votes: [...(option.votes || []), newVote]
          };
        }
        return option;
      });

      await FamilyPoll.update(pollId, { options: updatedOptions });
      toast.success('Vote recorded! 🗳️');
      loadData();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await FamilyPoll.update(pollId, { status: 'closed' });
      toast.success('Poll closed!');
      loadData();
    } catch (error) {
      console.error('Error closing poll:', error);
      toast.error('Failed to close poll');
    }
  };

  const activePolls = polls.filter(p => p.status === 'active');
  const closedPolls = polls.filter(p => p.status === 'closed');
  const displayedPolls = activeTab === 'active' ? activePolls : closedPolls;

  const getMemberById = (id) => members.find(m => m.id === id);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Family Polls</h1>
            <p className="text-slate-600">Make group decisions together democratically! 🗳️</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Poll
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Active Polls</p>
                <p className="text-2xl font-bold text-blue-900">{activePolls.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">{closedPolls.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Family Members</p>
                <p className="text-2xl font-bold text-purple-900">{members.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('active')}
            className="rounded-md"
          >
            <Clock className="w-4 h-4 mr-2" />
            Active ({activePolls.length})
          </Button>
          <Button
            variant={activeTab === 'closed' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('closed')}
            className="rounded-md"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Closed ({closedPolls.length})
          </Button>
        </div>
      </motion.div>

      {/* Polls List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading polls...</p>
        </div>
      ) : displayedPolls.length > 0 ? (
        <div className="space-y-6">
          {displayedPolls.map((poll, index) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PollCard
                poll={poll}
                currentUser={currentUser}
                creator={getMemberById(poll.created_by)}
                onVote={handleVote}
                onClose={handleClosePoll}
                onUpdate={loadData}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-2 border-dashed">
          <CardContent>
            <Vote className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {activeTab === 'active' ? 'No Active Polls' : 'No Closed Polls'}
            </h3>
            <p className="text-slate-500 mb-4">
              {activeTab === 'active' 
                ? 'Create your first poll to get family input on decisions!' 
                : 'Closed polls will appear here.'}
            </p>
            {activeTab === 'active' && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-purple-500 hover:bg-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Poll
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePollModal
            onClose={() => setShowCreateModal(false)}
            onPollCreated={() => {
              setShowCreateModal(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}