
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, MoreHorizontal, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FitnessPost } from '@/api/entities';
import { User } from '@/api/entities';
import { toast } from 'sonner';

const Reactions = ({ post, onReactionUpdate }) => {
    const emojis = ['🔥', '💪', '😂', '👏'];
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (error) {
                console.error('Could not load user for reactions');
            }
        };
        loadUser();
    }, []);

    const handleReaction = async (emoji) => {
        if (!user) {
            toast.error('Please log in to react');
            return;
        }

        try {
            const existingReactions = post.reactions || [];
            
            // Check if user already reacted with this emoji
            const existingReactionIndex = existingReactions.findIndex(
                r => r.user_id === user.id && r.emoji === emoji
            );

            let updatedReactions;
            if (existingReactionIndex >= 0) {
                // Remove existing reaction
                updatedReactions = existingReactions.filter((_, index) => index !== existingReactionIndex);
                toast.success('Reaction removed');
            } else {
                // Add new reaction
                updatedReactions = [...existingReactions, { emoji, user_id: user.id }];
                toast.success(`Reacted with ${emoji}`);
            }

            await FitnessPost.update(post.id, { reactions: updatedReactions });
            onReactionUpdate();
        } catch (error) {
            console.error('Failed to update reaction:', error);
            toast.error('Failed to react');
        }
    };

    const getReactionCount = (emoji) => {
        return (post.reactions || []).filter(r => r.emoji === emoji).length;
    };

    const hasUserReacted = (emoji) => {
        return user && (post.reactions || []).some(r => r.user_id === user.id && r.emoji === emoji);
    };

    return (
        <div className="flex items-center gap-2">
            {emojis.map(emoji => {
                const count = getReactionCount(emoji);
                const userReacted = hasUserReacted(emoji);
                
                return (
                    <motion.button 
                        key={emoji}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReaction(emoji)}
                        className={`px-3 py-1.5 rounded-2xl text-lg transition-all flex items-center gap-1 ${
                            userReacted 
                                ? 'bg-green-100 border border-green-300' 
                                : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                    >
                        {emoji}
                        {count > 0 && <span className="text-xs text-slate-600 ml-1">{count}</span>}
                    </motion.button>
                );
            })}
        </div>
    );
};

export default function FitnessPostCard({ post, author, onUpdate }) {
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

  if (!author) {
    return null; 
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }
    
    setIsAddingComment(true);
    try {
      const existingComments = post.comments || [];
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
      
      await FitnessPost.update(post.id, { 
        comments: updatedComments,
        comments_count: updatedComments.length
      });
      
      toast.success('Comment added!');
      setNewComment('');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleReactionUpdate = () => {
    if (onUpdate) onUpdate();
  };

  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = (now - activityDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Card className="rounded-2xl shadow-lg shadow-slate-200/50 border-slate-200/60 overflow-hidden">
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={author.avatar_url} />
              <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-slate-900">{author.name}</p>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
      </div>

      {post.image_url && (
        <img src={post.image_url} alt="Fitness post" className="w-full h-auto max-h-[500px] object-cover" />
      )}

      <div className="p-4 bg-white">
        {post.content && (
          <p className="text-slate-700 mb-4">{post.content}</p>
        )}

        <div className="flex items-center justify-between mb-4">
          <Reactions post={post} onReactionUpdate={handleReactionUpdate} />
          <Button 
            variant="ghost" 
            className="text-slate-600 hover:bg-slate-100 rounded-xl"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {post.comments?.length > 0 ? `${post.comments.length} Comments` : 'Comment'}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-4 border-t border-slate-100"
          >
            {/* Display existing comments */}
            {post.comments && post.comments.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                {post.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.user_avatar} />
                      <AvatarFallback className="text-xs">
                        {comment.user_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {comment.user_name}
                      </p>
                      <p className="text-sm text-slate-700 mt-1">{comment.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTime(comment.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment input */}
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar_url || `https://avatar.vercel.sh/${currentUser?.email}.png`} />
                <AvatarFallback>{currentUser?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                {isAddingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
