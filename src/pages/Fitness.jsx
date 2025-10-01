
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { FamilyMember } from "@/api/entities";
import { FitnessPost } from "@/api/entities";
import { FitnessGoal } from "@/api/entities";

import FamilyMemberGrid from "../components/fitness/FamilyMemberGrid";
import FitnessPostCard from "../components/fitness/FitnessPostCard";
import GoalTrackerCard from "../components/fitness/GoalTrackerCard";
import NewPostModal from "../components/fitness/NewPostModal";
import ProfileSnapshotModal from "../components/fitness/ProfileSnapshotModal";

export default function Fitness() {
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    loadFitnessData();
  }, []);

  const loadFitnessData = async () => {
    setIsLoading(true);
    try {
      const [memberData, postData, goalData] = await Promise.all([
        FamilyMember.list(),
        FitnessPost.list("-created_date"),
        FitnessGoal.list()
      ]);
      setMembers(memberData);
      setPosts(postData);
      setGoals(goalData);
    } catch (error) {
      console.error("Error loading fitness data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMemberById = (id) => members.find(m => m.id === id);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Family Fitness Hub
          </h1>
          <p className="text-slate-600 mt-1">Your family's private space to share progress and cheer each other on.</p>
        </div>
        <Button onClick={() => setShowNewPostModal(true)} className="bg-green-500 hover:bg-green-600 rounded-2xl shadow-lg shadow-green-500/20">
          <Plus className="mr-2 h-5 w-5" />
          Quick Upload
        </Button>
      </motion.div>

      {/* Family Member Profiles */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <FamilyMemberGrid members={members} onMemberClick={handleMemberClick} />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Fitness Feed */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <p>Loading feed...</p>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <FitnessPostCard post={post} author={getMemberById(post.family_member_id)} onUpdate={loadFitnessData} />
              </motion.div>
            ))
          )}
          {posts.length === 0 && !isLoading && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <p className="text-slate-500">The feed is empty. Share your first workout!</p>
            </div>
          )}
        </div>

        {/* Goals & Rewards */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Goals & Rewards</h2>
          {isLoading ? (
            <p>Loading goals...</p>
          ) : (
             goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <GoalTrackerCard goal={goal} member={getMemberById(goal.family_member_id)} />
              </motion.div>
            ))
          )}
           {goals.length === 0 && !isLoading && (
             <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                <p className="text-slate-500">No active goals. Set one to get started!</p>
            </div>
           )}
        </div>
      </div>
      
      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal 
            onClose={() => setShowNewPostModal(false)} 
            onPostCreated={() => {
                setShowNewPostModal(false);
                loadFitnessData();
            }}
        />
      )}

      {/* Profile Snapshot Modal */}
      {selectedMember && (
        <ProfileSnapshotModal 
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
