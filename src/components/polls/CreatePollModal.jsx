import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FamilyPoll } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const emojiOptions = ['🍕', '🍣', '🌮', '🍔', '🍝', '🥗', '🏖️', '🎬', '🎮', '⚽', '🏠', '🌳', '🎵', '📚', '✅', '❤️', '⭐', '🎉'];

export default function CreatePollModal({ onClose, onPollCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([
    { text: '', emoji: '✅' },
    { text: '', emoji: '✅' }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { text: '', emoji: '✅' }]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    setIsCreating(true);
    try {
      const user = await User.me();
      const pollData = {
        title,
        description,
        created_by: user.id,
        options: validOptions.map(opt => ({
          text: opt.text.trim(),
          emoji: opt.emoji,
          votes: []
        })),
        status: 'active'
      };

      await FamilyPoll.create(pollData);
      toast.success('Poll created! 🗳️');
      onPollCreated();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-2xl font-bold text-slate-900">Create New Poll</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Poll Question */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold">Poll Question *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Where should we eat tonight?"
                className="mt-2 text-lg"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this poll..."
                className="mt-2"
                rows={2}
              />
            </div>

            {/* Options */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Poll Options *</Label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 items-center"
                  >
                    {/* Emoji Picker */}
                    <select
                      value={option.emoji}
                      onChange={(e) => updateOption(index, 'emoji', e.target.value)}
                      className="w-16 h-11 text-2xl text-center border border-slate-300 rounded-lg cursor-pointer hover:border-purple-400 transition-colors"
                    >
                      {emojiOptions.map(emoji => (
                        <option key={emoji} value={emoji}>{emoji}</option>
                      ))}
                    </select>

                    {/* Option Text */}
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />

                    {/* Remove Button */}
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Add Option Button */}
              {options.length < 10 && (
                <Button
                  variant="outline"
                  onClick={addOption}
                  className="mt-3 w-full border-dashed border-2 hover:border-purple-400 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Option
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Poll'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}