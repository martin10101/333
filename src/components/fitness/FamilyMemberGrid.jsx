import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function FamilyMemberGrid({ members, onMemberClick }) {
  const activityBadges = ["🏋️ 3hr gym class", "🏃 Ran 2km", "🧘 Yoga session", "🚴‍♀️ Cycled 10km"];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            className="flex flex-col items-center text-center space-y-2 cursor-pointer group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onMemberClick(member)}
          >
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-green-400 transition-all duration-300 group-hover:scale-105">
                <AvatarImage src={member.avatar_url} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            <p className="font-semibold text-sm text-slate-800">{member.name}</p>
            <Badge variant="secondary" className="text-xs bg-slate-100 group-hover:bg-green-100 group-hover:text-green-800 transition-colors">
              {activityBadges[index % activityBadges.length]}
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
}