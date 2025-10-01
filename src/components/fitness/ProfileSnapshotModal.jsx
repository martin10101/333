import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  TrendingUp, 
  Target, 
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  Trophy
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { FitnessPost } from '@/api/entities';
import { FitnessGoal } from '@/api/entities';

export default function ProfileSnapshotModal({ member, onClose }) {
  const [memberPosts, setMemberPosts] = useState([]);
  const [memberGoals, setMemberGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMemberData = async () => {
      setIsLoading(true);
      try {
        const [posts, goals] = await Promise.all([
          FitnessPost.filter({ family_member_id: member.id }, '-created_date', 5),
          FitnessGoal.filter({ family_member_id: member.id })
        ]);
        setMemberPosts(posts);
        setMemberGoals(goals);
      } catch (error) {
        console.error('Error loading member data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (member) {
      loadMemberData();
    }
  }, [member]);

  if (!member) return null;

  const totalGoals = memberGoals.length;
  const completedGoals = memberGoals.filter(g => g.current_value >= g.target_value).length;
  const activePosts = memberPosts.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-white/20">
                <AvatarImage src={member.avatar_url} alt={member.name} />
                <AvatarFallback className="text-2xl">{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-white/80 capitalize">{member.role} • {member.age} years old</p>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold">{activePosts}</div>
                    <div className="text-xs text-white/70">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{totalGoals}</div>
                    <div className="text-xs text-white/70">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{completedGoals}</div>
                    <div className="text-xs text-white/70">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-500">Loading {member.name}'s fitness journey...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Goals */}
                {memberGoals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Current Goals
                    </h3>
                    <div className="space-y-3">
                      {memberGoals.map((goal) => {
                        const progress = (goal.current_value / goal.target_value) * 100;
                        return (
                          <Card key={goal.id} className="border border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-slate-900">{goal.title}</h4>
                                <Badge variant={progress >= 100 ? 'default' : 'secondary'}>
                                  {progress >= 100 ? 'Completed!' : 'In Progress'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">
                                  {goal.current_value} / {goal.target_value} {goal.unit}
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              {goal.reward_pledges && goal.reward_pledges.length > 0 && (
                                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  Reward: {goal.reward_pledges[0].reward_value}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {memberPosts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {memberPosts.map((post) => (
                        <Card key={post.id} className="border border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {post.image_url && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                  <img 
                                    src={post.image_url} 
                                    alt="Workout" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-700 text-sm line-clamp-3 mb-2">
                                  {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                                  </div>
                                  {post.image_url && (
                                    <div className="flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      Photo
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty States */}
                {!isLoading && memberGoals.length === 0 && memberPosts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {member.name} is just getting started!
                    </h3>
                    <p className="text-slate-600 text-sm">
                      No fitness posts or goals yet. Encourage them to share their first workout!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Member since {format(new Date(), 'MMM yyyy')}
              </div>
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}