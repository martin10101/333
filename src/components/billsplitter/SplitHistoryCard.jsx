
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BillSplit } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Users, 
  DollarSign, 
  Calendar,
  Eye,
  Check,
  ChevronDown,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";

export default function SplitHistoryCard({ split: initialSplit, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [split, setSplit] = useState(initialSplit);
  const [userCashTag, setUserCashTag] = useState('');
  const [selectedPersonForPayment, setSelectedPersonForPayment] = useState('');
  const [selectedPersonForReminder, setSelectedPersonForReminder] = useState('');
  const [selectedPersonForResend, setSelectedPersonForResend] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await User.me();
        if (user?.cash_tag) {
          setUserCashTag(user.cash_tag);
        }
      } catch (error) {
        console.warn("Could not fetch user data for sending reminders.");
      }
    };
    fetchUserData();
  }, []);

  const completedPayments = split.participants?.filter(p => p.payment_status === 'paid').length || 0;
  const totalParticipants = split.participants?.length || split.number_of_people;

  // Create participants list (use saved participants or create default ones)
  const participantsList = split.participants && split.participants.length > 0 
    ? split.participants
    : Array(split.number_of_people).fill().map((_, i) => ({
        name: `Person ${i + 1}`,
        phone: "",
        email: "",
        payment_method: "cash_app",
        payment_status: "pending",
        amount_owed: split.per_person_amount || 0
      }));

  const handleMarkAsPaid = async () => {
    if (!selectedPersonForPayment) {
      toast.error("Please select a person to mark as paid");
      return;
    }

    const participantIndex = parseInt(selectedPersonForPayment);
    const updatedParticipants = participantsList.map((p, index) => 
      index === participantIndex ? { ...p, payment_status: 'paid' } : p
    );

    try {
      await BillSplit.update(split.id, { 
        participants: updatedParticipants,
        number_of_people: split.number_of_people 
      });
      setSplit(prev => ({ ...prev, participants: updatedParticipants }));
      toast.success(`${participantsList[participantIndex].name} marked as paid!`);
      setSelectedPersonForPayment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update payment status:", error);
      toast.error("Could not update payment status.");
    }
  };

  const generatePaymentURL = (participant, cashTag) => {
    const amount = participant.amount_owed?.toFixed(2) || split.per_person_amount?.toFixed(2) || '0.00';
    const note = `Bill from ${split.restaurant_name || 'Restaurant'}`;
    
    if (participant.payment_method === 'cash_app' && cashTag) {
      return `https://cash.app/$${cashTag}/${amount}?note=${encodeURIComponent(note)}`;
    }
    return null;
  };

  const createDetailedMessage = (participant, paymentURL, isReminder = false) => {
    const restaurantName = split.restaurant_name || 'the restaurant';
    const billDate = split.session_date ? format(new Date(split.session_date), 'MMM d, yyyy at h:mm a') : format(new Date(split.created_date), 'MMM d, yyyy at h:mm a');
    const currentDate = format(new Date(), 'MMM d, yyyy at h:mm a');
    const amount = participant.amount_owed?.toFixed(2) || split.per_person_amount?.toFixed(2) || '0.00';
    
    let message = '';
    
    if (isReminder) {
      message = `🔔 PAYMENT REMINDER\n\n`;
      message += `Hi ${participant.name}! This is a friendly reminder about your share of our bill from ${restaurantName}.\n\n`;
    } else {
      message += `Hi ${participant.name}! Here's your share of our bill from ${restaurantName}.\n\n`;
    }
    
    message += `📍 Restaurant: ${restaurantName}\n`;
    message += `📅 Bill Date: ${billDate}\n`;
    message += `📤 ${isReminder ? 'Reminder' : 'Request'} Sent: ${currentDate}\n`;
    message += `💰 Your Amount: $${amount}\n\n`;
    
    if (paymentURL) {
      message += `💳 Quick Pay Link: ${paymentURL}\n\n`;
      message += `📱 Tap the link above to pay instantly!\n\n`;
    } else {
      message += `Please pay via ${participant.payment_method === 'cash' ? 'cash' : participant.payment_method} when convenient.\n\n`;
    }
    
    message += `Thanks! 😊`;
    
    return message;
  };
  
  const handleSendReminder = () => {
    if (!selectedPersonForReminder) {
      toast.error("Please select a person to send reminder to");
      return;
    }

    const participantIndex = parseInt(selectedPersonForReminder);
    const participant = participantsList[participantIndex];

    if (!participant.phone && !participant.email) {
      toast.error(`No contact info saved for ${participant.name}. Please add their contact information in the payment request modal.`);
      return;
    }
    
    const paymentURL = generatePaymentURL(participant, userCashTag);
    const message = createDetailedMessage(participant, paymentURL, true); // true for reminder

    if (participant.phone) {
      window.open(`sms:${participant.phone}?body=${encodeURIComponent(message)}`);
      toast.success(`Reminder message opened for ${participant.name}`);
    } else if (participant.email) {
      const subject = `Reminder: Payment for ${split.restaurant_name || 'Restaurant'}`;
      window.open(`mailto:${participant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`);
      toast.success(`Reminder email opened for ${participant.name}`);
    }
    
    setSelectedPersonForReminder('');
  };

  const handleResendRequest = () => {
    if (!selectedPersonForResend) {
      toast.error("Please select a person to resend request to");
      return;
    }

    const participantIndex = parseInt(selectedPersonForResend);
    const participant = participantsList[participantIndex];

    if (!participant.phone && !participant.email) {
      toast.error(`No contact info saved for ${participant.name}. Please add their contact information in the payment request modal.`);
      return;
    }
    
    const paymentURL = generatePaymentURL(participant, userCashTag);
    const message = createDetailedMessage(participant, paymentURL, false); // false for regular request

    if (participant.phone) {
      window.open(`sms:${participant.phone}?body=${encodeURIComponent(message)}`);
      toast.success(`Payment request resent to ${participant.name}`);
    } else if (participant.email) {
      const subject = `Payment Request: ${split.restaurant_name || 'Restaurant'}`;
      window.open(`mailto:${participant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`);
      toast.success(`Payment request resent to ${participant.name}`);
    }
    
    setSelectedPersonForResend('');
  };

  const unpaidParticipants = participantsList.filter(p => p.payment_status !== 'paid');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {split.restaurant_name || 'Restaurant'}
                </h3>
                <p className="text-sm text-slate-600">
                  {format(new Date(split.created_date), 'MMM d, yyyy • h:mm a')}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    {split.number_of_people} people
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    ${split.per_person_amount?.toFixed(2)} each
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-2 flex-shrink-0">
              <div className="text-2xl font-bold text-slate-900">
                ${split.total_amount?.toFixed(2)}
              </div>
              <Badge 
                variant={completedPayments === totalParticipants && totalParticipants > 0 ? 'default' : 'secondary'}
                className="mt-1"
              >
                {completedPayments}/{totalParticipants} paid
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              className="w-full justify-between"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>Manage Payments</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
            
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {/* Participant Status List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Participants:</h4>
                  {participantsList.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-medium">{participant.name}</span>
                        {participant.phone && (
                          <span className="text-slate-500 ml-2">📱 {participant.phone}</span>
                        )}
                        {participant.email && (
                          <span className="text-slate-500 ml-2">📧 {participant.email}</span>
                        )}
                      </div>
                      <Badge variant={participant.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {participant.payment_status === 'paid' ? 'Paid ✓' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Action Controls */}
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  {/* Mark as Paid */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mark as Paid:</label>
                    <div className="flex gap-2">
                      <Select value={selectedPersonForPayment} onValueChange={setSelectedPersonForPayment}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {unpaidParticipants.map((participant, index) => {
                            const originalIndex = participantsList.findIndex(p => p.name === participant.name);
                            return (
                              <SelectItem key={originalIndex} value={originalIndex.toString()}>
                                {participant.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleMarkAsPaid} disabled={!selectedPersonForPayment}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Resend Request */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Resend Request:</label>
                    <div className="flex gap-2">
                      <Select value={selectedPersonForResend} onValueChange={setSelectedPersonForResend}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {unpaidParticipants.map((participant, index) => {
                            const originalIndex = participantsList.findIndex(p => p.name === participant.name);
                            return (
                              <SelectItem key={originalIndex} value={originalIndex.toString()}>
                                {participant.name} {!participant.phone && !participant.email && '(No contact)'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleResendRequest} disabled={!selectedPersonForResend}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Send Reminder */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Send Reminder:</label>
                    <div className="flex gap-2">
                      <Select value={selectedPersonForReminder} onValueChange={setSelectedPersonForReminder}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {unpaidParticipants.map((participant, index) => {
                            const originalIndex = participantsList.findIndex(p => p.name === participant.name);
                            return (
                              <SelectItem key={originalIndex} value={originalIndex.toString()}>
                                {participant.name} {!participant.phone && !participant.email && '(No contact)'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleSendReminder} disabled={!selectedPersonForReminder}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
