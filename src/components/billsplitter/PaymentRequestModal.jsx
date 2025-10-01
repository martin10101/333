
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User } from '@/api/entities'; // Assuming User entity path
import { BillSplit } from '@/api/entities'; // Assuming BillSplit entity path, this needs to be added
import { 
  X, 
  QrCode, 
  MessageCircle, 
  Phone, 
  Mail,
  Copy,
  Check,
  DollarSign,
  Users,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns'; // Import date-fns for date formatting

export default function PaymentRequestModal({ billSplit, onClose, onRequestsSent, onParticipantsUpdate }) {
  const [participants, setParticipants] = useState(
    billSplit.participants?.length > 0 ? billSplit.participants :
    Array(billSplit.number_of_people).fill().map((_, i) => ({
      name: `Person ${i + 1}`,
      phone: "",
      email: "",
      payment_method: "cash_app",
      payment_status: "pending",
      amount_owed: billSplit.per_person_amount
    }))
  );
  const [userCashTag, setUserCashTag] = useState('');
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [isGeneratingRequests, setIsGeneratingRequests] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await User.me();
        if (user?.cash_tag) {
          setUserCashTag(user.cash_tag);
        }
      } catch (error) {
        console.warn("Could not fetch user data, proceeding as guest.");
        // Optionally, show a toast or handle error more gracefully
      }
    };
    fetchUserData();
  }, []);

  const handleCashTagBlur = async (e) => {
    const newCashTag = e.target.value.trim(); // Trim whitespace
    if (newCashTag && newCashTag !== userCashTag) { // Only save if different and not empty
      setIsSaving(true);
      try {
        await User.updateMyUserData({ cash_tag: newCashTag });
        toast.success("Cash App tag saved!");
      } catch (error) {
        toast.error("Could not save Cash App tag.");
        console.error("Failed to save cashtag:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateParticipant = (index, field, value) => {
    setParticipants(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const generatePaymentURL = (participant, cashTag) => {
    const amount = participant.amount_owed.toFixed(2);
    const note = `Bill split - ${billSplit.restaurant_name || 'Restaurant'}`;
    
    switch (participant.payment_method) {
      case 'cash_app':
        if (!cashTag) return null; // Don't generate if no cashtag
        return `https://cash.app/$${cashTag}/${amount}?note=${encodeURIComponent(note)}`;
      case 'zelle':
        // Zelle doesn't have a direct public payment URL schema like Cash App.
        // This is a placeholder and would typically involve contact info for the Zelle recipient.
        // For simplicity, we'll just indicate it's not directly linkable for now.
        return null; // For Zelle, a direct payment URL is not commonly generated for arbitrary recipients.
      default:
        return null;
    }
  };

  const generateQRCode = async (url) => {
    // In a real app, you'd use a QR code library
    // This is a free public API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const generateAllRequests = async () => {
    setIsGeneratingRequests(true);
    
    try {
      const requests = await Promise.all(
        participants.map(async (participant) => {
          const paymentURL = generatePaymentURL(participant, userCashTag);
          const qrCode = paymentURL ? await generateQRCode(paymentURL) : null;
          const billDate = billSplit.session_date ? format(new Date(billSplit.session_date), 'MMM d, yyyy') : 'a recent meal';
          
          return {
            participant,
            paymentURL,
            qrCode,
            message: `Hi ${participant.name}! For the bill at ${billSplit.restaurant_name || 'the restaurant'} on ${billDate}, your share is $${participant.amount_owed.toFixed(2)}. ${paymentURL ? `You can pay here: ${paymentURL}` : 'Please pay via your selected method.'}`
          };
        })
      );
      
      setPaymentRequests(requests.filter(Boolean)); // Keep filtering for safety
    } catch (error) {
      console.error('Error generating payment requests:', error);
      toast.error('Failed to generate payment requests');
    } finally {
      setIsGeneratingRequests(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const sendSMSRequest = (participant, message) => {
    if (participant.phone) {
      // Use window.open to allow the browser to handle the SMS link
      // Note: This might not work universally or might require user interaction/permission
      window.open(`sms:${participant.phone}?body=${encodeURIComponent(message)}`);
      toast.success(`SMS opened for ${participant.name}`);
    } else {
      toast.error(`No phone number for ${participant.name}`);
    }
  };

  const sendEmailRequest = (participant, message) => {
    if (participant.email) {
      const subject = `Bill Split - ${billSplit.restaurant_name || 'Restaurant'}`;
      // Use window.open to allow the browser to handle the Mailto link
      window.open(`mailto:${participant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`);
      toast.success(`Email opened for ${participant.name}`);
    } else {
      toast.error(`No email address for ${participant.name}`);
    }
  };

  const handleFinalize = async () => {
    // Save participant details back to the database
    try {
      await BillSplit.update(billSplit.id, { participants });
      toast.success('Participant details saved!');
      
      if (onParticipantsUpdate) {
        onParticipantsUpdate(participants);
      }
      onRequestsSent();
    } catch (error) {
      console.error('Error saving participants:', error);
      toast.error('Failed to save participant details');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send Payment Requests</h2>
            <p className="text-slate-600 mt-1">
              Total: ${billSplit.total_amount.toFixed(2)} • Per Person: ${billSplit.per_person_amount.toFixed(2)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Participant Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Participant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((participant, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      placeholder={`Person ${index + 1}`}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={participant.phone}
                      onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                     <Input
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      placeholder="friend@example.com"
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={participant.payment_method}
                      onValueChange={(value) => updateParticipant(index, 'payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_app">Cash App</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* User's Payment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Your Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="cashTag">Your Cash App $Cashtag</Label>
              <div className="relative">
                <Input 
                  id="cashTag" 
                  value={userCashTag}
                  onChange={(e) => setUserCashTag(e.target.value)}
                  onBlur={handleCashTagBlur}
                  placeholder="YourCashTag"
                  className={isSaving ? "pr-10" : ""} // Add padding for loader
                />
                {isSaving && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-slate-400" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">Enter your $Cashtag to generate payment links. It will be saved automatically.</p>
            </CardContent>
          </Card>

          {/* Generate Requests Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={generateAllRequests}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isGeneratingRequests}
            >
              {isGeneratingRequests ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Payment Requests
                </>
              )}
            </Button>
          </div>

          {/* Payment Requests */}
          {paymentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Payment Requests Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentRequests.map((request, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{request.participant.name}</h3>
                        <Badge variant="secondary">{request.participant.payment_method}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${request.participant.amount_owed.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    {request.qrCode && (
                      <div className="flex justify-center mb-4">
                        <img src={request.qrCode} alt="Payment QR Code" className="w-32 h-32" />
                      </div>
                    )}

                    {/* Payment URL */}
                    {request.paymentURL && (
                      <div className="mb-4">
                        <Label>Payment Link</Label>
                        <div className="flex gap-2 mt-1">
                          <Input value={request.paymentURL} readOnly className="text-sm" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(request.paymentURL)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {!request.paymentURL && request.participant.payment_method !== 'cash' && (
                       <div className="mb-4 text-sm text-yellow-600">
                         Note: A direct payment link could not be generated for this method.
                       </div>
                    )}

                    {/* Message */}
                    <div className="mb-4">
                      <Label>Message</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={request.message} readOnly className="text-sm" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(request.message)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Send Options */}
                    <div className="flex gap-2">
                      {request.participant.phone && (
                        <Button
                          variant="outline"
                          onClick={() => sendSMSRequest(request.participant, request.message)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send SMS
                        </Button>
                      )}
                      {request.participant.email && (
                        <Button
                          variant="outline"
                          onClick={() => sendEmailRequest(request.participant, request.message)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4 mr-2" />
            Done & Save Participants
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
