import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Calendar, 
  DollarSign, 
  Eye, 
  Trash2,
  Tag,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categoryColors = {
  groceries: "bg-green-100 text-green-800 border-green-200",
  dining: "bg-orange-100 text-orange-800 border-orange-200",
  shopping: "bg-purple-100 text-purple-800 border-purple-200",
  utilities: "bg-blue-100 text-blue-800 border-blue-200",
  healthcare: "bg-red-100 text-red-800 border-red-200",
  transportation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  entertainment: "bg-pink-100 text-pink-800 border-pink-200",
  education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  household: "bg-gray-100 text-gray-800 border-gray-200",
  other: "bg-slate-100 text-slate-800 border-slate-200"
};

export default function ReceiptCard({ receipt, index, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60 hover:border-slate-300/60">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{receipt.store_name}</h3>
                <p className="text-sm text-slate-600">
                  {format(new Date(receipt.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-slate-900">${receipt.amount?.toFixed(2)}</p>
              <Badge 
                variant="secondary" 
                className={`${categoryColors[receipt.category]} border text-xs`}
              >
                {receipt.category}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {receipt.tags && receipt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {receipt.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {receipt.items && receipt.items.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Items ({receipt.items.length}):</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {receipt.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-xs text-slate-600 flex justify-between">
                    <span>{item.name}</span>
                    <span>${item.price?.toFixed(2)}</span>
                  </div>
                ))}
                {receipt.items.length > 3 && (
                  <p className="text-xs text-slate-500">+{receipt.items.length - 3} more items</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Badge variant={receipt.status === 'approved' ? 'default' : 'secondary'}>
              {receipt.status}
            </Badge>
            
            <div className="flex gap-2">
              {receipt.image_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(receipt.image_url, '_blank')}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this receipt from {receipt.store_name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}