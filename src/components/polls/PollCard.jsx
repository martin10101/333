import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, CheckCircle2, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PollCard({ poll, currentUser, creator, onVote, onClose, onUpdate }) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const userVoted = currentUser && poll.options.some(opt => 
    opt.votes?.some(vote => vote.user_id === currentUser.id)
  );

  // Find winning option(s)
  const maxVotes = Math.max(...poll.options.map(opt => opt.votes?.length || 0));
  const winners = poll.options.filter(opt => (opt.votes?.length || 0) === maxVotes && maxVotes > 0);

  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                <AvatarImage src={creator?.avatar_url} />
                <AvatarFallback>{creator?.name?.charAt(0) || 'F'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{creator?.name || 'Family Member'}</span> asked
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(poll.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{poll.title}</h3>
            {poll.description && (
              <p className="text-slate-600 text-sm">{poll.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={poll.status === 'active' ? 'default' : 'secondary'} className={poll.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
              {poll.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Closed
                </>
              )}
            </Badge>
            <Badge variant="outline" className="bg-white">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Options */}
      <CardContent className="p-6">
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const voteCount = option.votes?.length || 0;
            const percentage = getVotePercentage(voteCount);
            const isWinner = poll.status === 'closed' && winners.includes(option) && totalVotes > 0;
            const userVotedThis = currentUser && option.votes?.some(vote => vote.user_id === currentUser.id);

            return (
              <motion.div
                key={index}
                whileHover={poll.status === 'active' ? { scale: 1.02 } : {}}
                whileTap={poll.status === 'active' ? { scale: 0.98 } : {}}
              >
                <Button
                  onClick={() => poll.status === 'active' && onVote(poll.id, index)}
                  disabled={poll.status === 'closed'}
                  className={`w-full h-auto p-0 overflow-hidden relative ${
                    poll.status === 'active' ? 'hover:shadow-md' : 'cursor-default'
                  }`}
                  variant="outline"
                >
                  {/* Background Progress Bar */}
                  <div 
                    className={`absolute inset-0 transition-all duration-500 ${
                      isWinner 
                        ? 'bg-gradient-to-r from-amber-100 to-amber-200' 
                        : userVotedThis
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200'
                        : 'bg-gradient-to-r from-slate-100 to-slate-50'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  {/* Content */}
                  <div className="relative w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{option.emoji}</span>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-900">{option.text}</p>
                        {voteCount > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex -space-x-2">
                              {option.votes.slice(0, 3).map((vote, idx) => (
                                <div 
                                  key={idx}
                                  className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                                >
                                  {vote.user_name?.charAt(0)}
                                </div>
                              ))}
                              {voteCount > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                  +{voteCount - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isWinner && (
                        <Trophy className="w-5 h-5 text-amber-500 mb-1" />
                      )}
                      <span className="text-2xl font-bold text-slate-900">{voteCount}</span>
                      <span className="text-xs text-slate-600 font-semibold">{percentage}%</span>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Poll Actions */}
        <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            {userVoted && poll.status === 'active' && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                You voted
              </Badge>
            )}
            {poll.status === 'closed' && winners.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-700 font-semibold">
                <Trophy className="w-4 h-4" />
                Winner{winners.length > 1 ? 's' : ''}: {winners.map(w => w.text).join(', ')}
              </div>
            )}
          </div>
          {currentUser && poll.created_by === currentUser.id && poll.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClose(poll.id)}
              className="text-slate-600 hover:text-slate-900"
            >
              <Lock className="w-4 h-4 mr-2" />
              Close Poll
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}