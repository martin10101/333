
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Receipt, 
  StickyNote, 
  ChefHat, 
  Dumbbell, 
  Trophy, 
  CheckCircle2,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Users,
  LogIn,
  Home,
  Heart,
  MessageCircle,
  Camera,
  Activity,
  Star,
  Send,
  Loader2,
  Video
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import { Receipt as ReceiptEntity, FamilyNote, Recipe, FitnessLog, Achievement, ApprovalRequest, FitnessPost, FamilyMember } from "@/api/entities";
import { User } from "@/api/entities";

const FamilyActivityCard = ({ activity, member, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
      const loadUser = async () => {
          try {
              const user = await User.me();
              setCurrentUser(user);
          } catch (e) { console.log("User not logged in"); }
      };
      loadUser();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'fitness_post':
        return <Dumbbell className="w-5 h-5 text-green-500" />;
      case 'receipt':
        return <Receipt className="w-5 h-5 text-blue-500" />;
      case 'note':
        return <StickyNote className="w-5 h-5 text-purple-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'fitness_post':
        return activity.content || 'shared a workout update';
      case 'receipt':
        return `spent $${activity.amount?.toFixed(2)} at ${activity.store_name}`;
      case 'note':
        return `created "${activity.title}"`;
      case 'achievement':
        return `earned "${activity.title}" achievement`;
      default:
        return 'had some activity';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = (now - activityDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleReaction = async (emoji) => {
    if (!currentUser) {
        toast.error('Please log in to react');
        return;
    }
    try {
        const existingReactions = activity.reactions || [];
        const existingReactionIndex = existingReactions.findIndex(r => r.user_id === currentUser.id && r.emoji === emoji);

        let updatedReactions;
        if (existingReactionIndex >= 0) {
            // User already reacted with this emoji, remove it
            updatedReactions = existingReactions.filter((_, index) => index !== existingReactionIndex);
        } else {
            // User hasn't reacted with this emoji, add it
            updatedReactions = [...existingReactions, { emoji, user_id: currentUser.id }];
        }

        await FitnessPost.update(activity.id, { reactions: updatedReactions });
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error("Failed to add reaction:", error);
        toast.error('Failed to add reaction');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
        toast.error('Please log in to comment');
        return;
    }
    setIsAddingComment(true);
    try {
        const existingComments = activity.comments || [];
        const updatedComments = [
            ...existingComments,
            {
                text: newComment,
                user_id: currentUser.id,
                user_name: currentUser.full_name,
                user_avatar: `https://avatar.vercel.sh/${currentUser.email}.png`,
                timestamp: new Date().toISOString()
            }
        ];
        
        await FitnessPost.update(activity.id, { 
            comments: updatedComments,
            comments_count: updatedComments.length
        });
        
        setNewComment('');
        if (onUpdate) onUpdate();
        toast.success("Comment added!");
    } catch (error) {
        console.error("Failed to add comment:", error);
        toast.error('Failed to add comment');
    } finally {
        setIsAddingComment(false);
    }
  };

  const getReactionCount = (emoji) => (activity.reactions || []).filter(r => r.emoji === emoji).length;
  const hasUserReacted = (emoji) => currentUser && (activity.reactions || []).some(r => r.user_id === currentUser.id && r.emoji === emoji);
  const emojis = ['🔥', '💪', '😂', '👏'];


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
          <AvatarImage src={member?.avatar_url} />
          <AvatarFallback>{member?.name?.charAt(0) || 'F'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{member?.name || 'Family Member'}</span>
            {getActivityIcon(activity.type)}
            <span className="text-xs text-slate-500">{formatTime(activity.created_date)}</span>
          </div>
          <p className="text-slate-700 text-sm mb-2">
            {getActivityMessage(activity)}
          </p>
          {activity.image_url && (
            <div className="mt-3">
              <img 
                src={activity.image_url} 
                alt="Activity" 
                className="w-full h-auto max-h-80 object-cover rounded-lg border border-slate-200"
              />
            </div>
          )}
          {activity.type === 'fitness_post' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      {emojis.map(emoji => {
                          const count = getReactionCount(emoji);
                          const userReacted = hasUserReacted(emoji);
                          return (
                              <motion.button 
                                  key={emoji}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleReaction(emoji)}
                                  className={`px-2.5 py-1 rounded-full text-base transition-all flex items-center gap-1.5 ${
                                      userReacted 
                                          ? 'bg-blue-100 border border-blue-300' 
                                          : 'bg-slate-100 hover:bg-slate-200'
                                  }`}
                              >
                                  {emoji}
                                  {count > 0 && <span className="text-xs text-slate-600">{count}</span>}
                              </motion.button>
                          );
                      })}
                  </div>

                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:bg-slate-100 rounded-xl"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">
                      {activity.comments?.length > 0 ? `${activity.comments.length}` : 'Comment'}
                    </span>
                  </Button>
              </div>

              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2 border-t border-slate-100"
                >
                  {/* Existing Comments */}
                  {activity.comments && activity.comments.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {activity.comments.map((comment, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={comment.user_avatar} />
                            <AvatarFallback className="text-xs">
                              {comment.user_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {comment.user_name}
                            </p>
                            <p className="text-sm text-slate-700">{comment.text}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatTime(comment.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex gap-2 items-center">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={currentUser?.avatar_url || `https://avatar.vercel.sh/${currentUser?.email}.png`} />
                        <AvatarFallback>{currentUser?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 rounded-full text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isAddingComment}
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600 rounded-full h-8 w-8"
                    >
                        {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatsCard = ({ title, value, icon: Icon, trend, color, href }) => (
  <Link to={href} className="block">
    <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60 hover:border-slate-300/60 min-w-[140px] flex-shrink-0">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-1 text-xs">
                <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
                <span className="text-emerald-600 font-medium text-xs">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-sm group-hover:shadow-md transition-all duration-300`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const FamilyMemberPreview = ({ member, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center text-center space-y-2 cursor-pointer min-w-[80px] flex-shrink-0"
    onClick={() => onClick(member)}
  >
    <div className="relative">
      <Avatar className="w-14 h-14 border-3 border-white shadow-lg">
        <AvatarImage src={member.avatar_url} />
        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
    </div>
    <div>
      <p className="font-semibold text-xs text-slate-900 truncate max-w-[70px]">{member.name}</p>
      <Badge variant="secondary" className="text-xs px-1 py-0">Active</Badge>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [recentFitnessPosts, setRecentFitnessPosts] = useState([]);
  const [familyActivities, setFamilyActivities] = useState([]);
  const [stats, setStats] = useState({
    receipts: 0,
    notes: 0,
    recipes: 0,
    workouts: 0,
    achievements: 0,
    approvals: 0
  });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        await loadDashboardData();
      } catch (error) {
        setUser(null);
        setRecentReceipts([]);
        setRecentNotes([]);
        setPendingApprovals([]);
        setRecentAchievements([]);
        setFamilyMembers([]);
        setRecentFitnessPosts([]);
        setFamilyActivities([]);
        setStats({ receipts: 0, notes: 0, recipes: 0, workouts: 0, achievements: 0, approvals: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndLoadData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [receipts, notes, recipes, fitness, achievements, approvals, members, fitnessPosts] = await Promise.all([
        ReceiptEntity.list('-created_date', 5),
        FamilyNote.list('-created_date', 5),
        Recipe.list(),
        FitnessLog.list(),
        Achievement.list('-created_date', 3),
        ApprovalRequest.filter({ status: 'pending' }, '-created_date'),
        FamilyMember.list(),
        FitnessPost.list('-created_date', 10)
      ]);

      setRecentReceipts(receipts);
      setRecentNotes(notes);
      setPendingApprovals(approvals);
      setRecentAchievements(achievements);
      setFamilyMembers(members);
      setRecentFitnessPosts(fitnessPosts);
      
      // Combine different activities into one feed
      const activities = [
        ...fitnessPosts.map(post => ({ ...post, type: 'fitness_post' })),
        ...receipts.slice(0, 3).map(receipt => ({ ...receipt, type: 'receipt' })),
        ...notes.slice(0, 3).map(note => ({ ...note, type: 'note' })),
        ...achievements.map(achievement => ({ ...achievement, type: 'achievement' }))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);

      setFamilyActivities(activities);
      
      setStats({
        receipts: receipts.length,
        notes: notes.filter(n => n.status !== 'completed').length,
        recipes: recipes.length,
        workouts: fitnessPosts.length,
        achievements: achievements.length,
        approvals: approvals.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getMemberById = (id) => familyMembers.find(m => m.id === id);

  const handleMemberClick = (member) => {
    // Navigate to member's profile or fitness section
    window.location.href = createPageUrl("Fitness");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><p className="text-slate-500">Loading Family Hub...</p></div>;
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
            <Home className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">Welcome to Family Hub</h1>
          <p className="text-base text-slate-600 mb-6">
            Your family's private social network. Share moments, track progress, and stay connected.
          </p>
          <Button size="lg" className="bg-slate-800 hover:bg-slate-900 shadow-lg" onClick={() => User.login()}>
            <LogIn className="w-5 h-5 mr-2" />
            Join Your Family Hub
          </Button>
          <p className="text-sm text-slate-500 mt-3">
            Sign in to see your family's latest updates.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto bg-gradient-to-br from-slate-50 to-white min-h-screen">
      {/* Family Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
            👨‍👩‍👧‍👦 Your Family Hub
          </h1>
          <p className="text-sm md:text-base text-slate-600">Stay connected • Share moments • Celebrate together</p>
        </div>

        {/* Family Members Preview - Horizontal Scroll */}
        {familyMembers.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
            <CardContent className="p-3">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-4 min-w-max">
                  {familyMembers.map((member) => (
                    <FamilyMemberPreview 
                      key={member.id} 
                      member={member} 
                      onClick={handleMemberClick}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Family Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Family Activities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Family Feed
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{familyActivities.length} updates</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {familyActivities.length > 0 ? (
                    familyActivities.map((activity, index) => (
                      <FamilyActivityCard 
                        key={`${activity.type}-${activity.id}-${index}`}
                        activity={activity}
                        member={getMemberById(activity.family_member_id || activity.requested_by)}
                        onUpdate={loadDashboardData}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <Camera className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No family activities yet. Start sharing your moments!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats - Horizontal Scroll */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                <StatsCard
                  title="Workouts"
                  value={stats.workouts}
                  icon={Dumbbell}
                  trend="+3 this week"
                  color="from-green-500 to-green-600"
                  href={createPageUrl("Fitness")}
                />
                <StatsCard
                  title="Expenses"
                  value={`$${recentReceipts.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(0)}`}
                  icon={Receipt}
                  color="from-blue-500 to-blue-600"
                  href={createPageUrl("Receipts")}
                />
                <StatsCard
                  title="Tasks"
                  value={stats.notes}
                  icon={Clock}
                  color="from-purple-500 to-purple-600"
                  href={createPageUrl("Notes")}
                />
                <StatsCard
                  title="Goals"
                  value={stats.achievements}
                  icon={Trophy}
                  color="from-amber-500 to-amber-600"
                  href={createPageUrl("Achievements")}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Video Call Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button 
              onClick={() => setShowVideoCallModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg rounded-xl h-16 text-lg font-semibold"
            >
              <Video className="w-6 h-6 mr-3" />
              Start Family Video Call
            </Button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <Link to={createPageUrl("Fitness")} className="block">
                  <Button className="w-full bg-green-500 hover:bg-green-600 rounded-xl text-sm py-2">
                    <Camera className="w-4 h-4 mr-2" />
                    Share Workout
                  </Button>
                </Link>
                <Link to={createPageUrl("Receipts")} className="block">
                  <Button variant="outline" className="w-full rounded-xl text-sm py-2">
                    <Receipt className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
                <Link to={createPageUrl("Notes")} className="block">
                  <Button variant="outline" className="w-full rounded-xl text-sm py-2">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Create Note
                  </Button>
                </Link>
                <Link to={createPageUrl("BillSplitter")} className="block">
                  <Button variant="outline" className="w-full rounded-xl text-sm py-2">
                    <Users className="w-4 h-4 mr-2" />
                    Split Bill
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-amber-900 text-base">
                    <Star className="w-4 h-4 text-amber-600" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {recentAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/70">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{achievement.title}</p>
                          <p className="text-xs text-slate-600">{achievement.category}</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          +{achievement.points}pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {pendingApprovals.slice(0, 3).map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-slate-900 truncate">{approval.title}</p>
                          <p className="text-xs text-blue-700">{approval.type}</p>
                        </div>
                        {approval.amount && (
                          <Badge variant="outline" className="bg-blue-100 text-xs ml-2">
                            ${approval.amount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link to={createPageUrl("Approvals")} className="block mt-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl text-sm py-2">
                      Review All
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Video Call Modal Placeholder */}
      {showVideoCallModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideoCallModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Call Header */}
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-purple-400" />
                Family Video Call
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowVideoCallModal(false)}
                className="text-white hover:bg-slate-700"
              >
                <span className="text-2xl">×</span>
              </Button>
            </div>

            {/* Video Grid Placeholder */}
            <div className="p-6 bg-slate-900">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {familyMembers.slice(0, 6).map((member, index) => (
                  <div 
                    key={member.id}
                    className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 flex items-center justify-center"
                  >
                    {/* Avatar Placeholder */}
                    <div className="flex flex-col items-center">
                      <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-purple-400">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                          {member.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white font-semibold mt-2">{member.name}</p>
                      <Badge variant="secondary" className="mt-1 bg-green-500 text-white text-xs">
                        Ready
                      </Badge>
                    </div>

                    {/* Mic indicator */}
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-full p-2">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Coming Soon Message */}
              <div className="text-center py-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Video Calling Coming Soon!</h3>
                <p className="text-slate-300 mb-6">
                  We're setting up high-quality video calling for your family. Soon you'll be able to connect face-to-face from anywhere!
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <div className="bg-slate-800 rounded-lg p-4 text-left">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-white font-semibold text-sm">HD Video Quality</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-left">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-white font-semibold text-sm">Up to 10 Participants</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-left">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-white font-semibold text-sm">Screen Sharing</p>
                  </div>
                </div>
              </div>

              {/* Control Bar */}
              <div className="mt-6 flex justify-center gap-4">
                <Button className="bg-slate-700 hover:bg-slate-600 rounded-full w-14 h-14" disabled>
                  <Video className="w-6 h-6" />
                </Button>
                <Button className="bg-slate-700 hover:bg-slate-600 rounded-full w-14 h-14" disabled>
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14" onClick={() => setShowVideoCallModal(false)}>
                  <span className="text-xl font-bold">×</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
