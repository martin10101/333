import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, X, ImageUp } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { FitnessPost } from '@/api/entities';
import { FamilyMember } from '@/api/entities'; // Import FamilyMember
import { User } from '@/api/entities';
import { toast } from 'sonner';

export default function NewPostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let imageUrl = null;
      if (file) {
        const uploadResult = await UploadFile({ file });
        imageUrl = uploadResult.file_url;
      }
      
      const user = await User.me();

      // Find or create a FamilyMember profile for the current user
      let familyMember = (await FamilyMember.filter({ name: user.full_name }, '', 1))[0];
      if (!familyMember) {
        toast.info(`Creating a new Family Member profile for ${user.full_name}...`);
        familyMember = await FamilyMember.create({
          id: user.id, // Explicitly set ID to match user ID for consistency
          name: user.full_name,
          role: 'parent', // Default role
          avatar_url: `https://avatar.vercel.sh/${user.email}.png`,
          age: 30 // Default age
        });
      }

      await FitnessPost.create({
        family_member_id: familyMember.id,
        content: content,
        image_url: imageUrl,
      });

      toast.success("Your workout has been posted!");
      onPostCreated();

    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error(err);
      toast.error("Something went wrong while posting.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Share your Progress</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <Textarea
              placeholder="How was your workout?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                {preview ? (
                    <div className="relative">
                        <img src={preview} alt="Preview" className="max-h-60 w-auto mx-auto rounded-lg" />
                        <Button variant="destructive" size="sm" className="absolute -top-2 -right-2 rounded-full h-7 w-7" onClick={() => { setFile(null); setPreview(null); }}>
                            <X className="w-4 h-4"/>
                        </Button>
                    </div>
                ) : (
                    <>
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <ImageUp className="mx-auto h-10 w-10 text-slate-400 mb-2"/>
                            <span className="font-semibold text-green-600">Click to upload</span>
                            <p className="text-xs text-slate-500">a photo or video</p>
                        </label>
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*"/>
                    </>
                )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 border-t flex justify-end rounded-b-2xl">
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600 rounded-xl">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Update
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}