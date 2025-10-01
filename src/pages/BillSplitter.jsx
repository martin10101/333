
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BillSplit } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Calculator, 
  Users, 
  DollarSign, 
  QrCode,
  MessageCircle,
  Phone,
  Mail,
  Receipt,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  Percent
} from "lucide-react";

import BillReceiptScanner from "../components/billsplitter/BillReceiptScanner";
import PaymentRequestModal from "../components/billsplitter/PaymentRequestModal";
import SplitHistoryCard from "../components/billsplitter/SplitHistoryCard";

export default function BillSplitter() {
  const [currentSplit, setCurrentSplit] = useState({
    subtotal: 0,
    tax_amount: 0,
    tip_amount: 0,
    tip_percentage: 18,
    total_amount: 0,
    number_of_people: 2,
    per_person_amount: 0,
    participants: [],
    receipt_image_url: null,
    restaurant_name: ""
  });
  
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'history'
  const [recentSplits, setRecentSplits] = useState([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [taxInputMode, setTaxInputMode] = useState('amount'); // 'amount' or 'percentage'
  const [taxPercentage, setTaxPercentage] = useState(8.5);
  const manualEntryRef = useRef(null);

  // Scroll to manual entry form when it appears
  useEffect(() => {
    if (isManualEntry && manualEntryRef.current) {
      setTimeout(() => {
        manualEntryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // Small delay to allow render
    }
  }, [isManualEntry]);

  // Memoize calculateTotal to prevent unnecessary re-creations and resolve useEffect dependency warning
  const calculateTotal = useCallback(() => {
    setCurrentSplit(prev => {
      const total = (prev.subtotal || 0) + (prev.tax_amount || 0) + (prev.tip_amount || 0);
      const perPerson = prev.number_of_people > 0 ? total / prev.number_of_people : 0;
      
      // Only update if the calculated values have changed to prevent unnecessary re-renders
      if (prev.total_amount !== total || prev.per_person_amount !== perPerson) {
        return {
          ...prev,
          total_amount: total,
          per_person_amount: perPerson
        };
      }
      return prev;
    });
  }, []); // This function now has no outside dependencies

  useEffect(() => {
    loadRecentSplits();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [currentSplit.subtotal, currentSplit.tax_amount, currentSplit.tip_amount, currentSplit.number_of_people, calculateTotal]);

  useEffect(() => {
    if (taxInputMode === 'percentage') {
      const calculatedTax = (currentSplit.subtotal || 0) * (taxPercentage / 100);
      setCurrentSplit(prev => ({ ...prev, tax_amount: calculatedTax }));
    }
  }, [currentSplit.subtotal, taxPercentage, taxInputMode]);

  const loadRecentSplits = async () => {
    try {
      const splits = await BillSplit.list('-created_date', 10);
      setRecentSplits(splits);
    } catch (error) {
      console.error('Error loading recent splits:', error);
    }
  };

  const calculateTipFromPercentage = (percentage) => {
    const subtotal = currentSplit.subtotal || 0;
    const tip = subtotal * (percentage / 100);
    setCurrentSplit(prev => ({
      ...prev,
      tip_percentage: percentage,
      tip_amount: tip
    }));
  };

  const handleReceiptScanned = (receiptData) => {
    setCurrentSplit(prev => ({
      ...prev,
      subtotal: receiptData.subtotal || receiptData.total_amount || 0,
      tax_amount: receiptData.tax_amount || 0,
      tip_amount: receiptData.tip_amount || 0,
      total_amount: receiptData.total_amount || 0,
      receipt_image_url: receiptData.image_url,
      restaurant_name: receiptData.store_name || receiptData.restaurant_name || ""
    }));
    setShowScanner(false);
    setIsManualEntry(false);
  };

  const updateParticipants = (numberOfPeople) => {
    const participants = Array(numberOfPeople).fill().map((_, i) => ({
      name: `Person ${i + 1}`,
      phone: "",
      email: "",
      payment_method: "cash_app",
      payment_status: "pending",
      amount_owed: currentSplit.per_person_amount
    }));
    
    setCurrentSplit(prev => ({
      ...prev,
      number_of_people: numberOfPeople,
      participants
    }));
  };

  const updateParticipant = (index, field, value) => {
    setCurrentSplit(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const saveBillSplit = async () => {
    try {
      const splitData = {
        ...currentSplit,
        session_date: new Date().toISOString(),
        participants: currentSplit.participants.map(p => ({
          ...p,
          amount_owed: currentSplit.per_person_amount
        }))
      };
      
      const savedSplit = await BillSplit.create(splitData);
      
      // Update currentSplit with the saved ID for the payment modal
      setCurrentSplit(prev => ({ ...prev, id: savedSplit.id }));
      
      loadRecentSplits();
      
      // Show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error saving bill split:', error);
    }
  };

  const resetCalculator = () => {
    setCurrentSplit({
      subtotal: 0,
      tax_amount: 0,
      tip_amount: 0,
      tip_percentage: 18,
      total_amount: 0,
      number_of_people: 2,
      per_person_amount: 0,
      participants: [],
      receipt_image_url: null,
      restaurant_name: ""
    });
    setIsManualEntry(false);
    setTaxInputMode('amount'); // Reset tax input mode
    setTaxPercentage(8.5); // Reset tax percentage
  };

  const QuickTipButton = ({ percentage }) => (
    <Button
      variant={currentSplit.tip_percentage === percentage ? "default" : "outline"}
      size="sm"
      onClick={() => calculateTipFromPercentage(percentage)}
      className="flex-1"
    >
      {percentage}%
    </Button>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Bill Splitter</h1>
            <p className="text-slate-600">Split restaurant bills instantly with smart payment requests</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'calculator' ? 'default' : 'outline'}
              onClick={() => setActiveTab('calculator')}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              onClick={() => setActiveTab('history')}
            >
              <Receipt className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </motion.div>

      {activeTab === 'calculator' ? (
        <div className="space-y-6">
          {/* Input Method Selection */}
          <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                How would you like to add the bill?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-8 h-8 text-blue-600" />
                  <span>Scan Receipt</span>
                </Button>
                <Button
                  variant={isManualEntry ? "secondary" : "outline"} 
                  className="h-20 flex flex-col gap-2 hover:border-green-300 hover:bg-green-50"
                  onClick={() => setIsManualEntry(prev => !prev)}
                >
                  <Calculator className="w-8 h-8 text-green-600" />
                  <span>Enter Manually</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry or Scanned Data */}
          <AnimatePresence>
          {(isManualEntry || currentSplit.receipt_image_url) && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              ref={manualEntryRef}
              style={{ overflow: 'hidden' }}
            >
              <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Bill Details
                    {currentSplit.restaurant_name && (
                      <Badge variant="secondary">{currentSplit.restaurant_name}</Badge>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetCalculator}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="restaurant_name">Restaurant Name</Label>
                    <Input
                      id="restaurant_name"
                      value={currentSplit.restaurant_name || ''}
                      onChange={(e) => setCurrentSplit(prev => ({ ...prev, restaurant_name: e.target.value }))}
                      placeholder="e.g., The Grand Cafe"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="subtotal">Subtotal</Label>
                      <Input
                        id="subtotal"
                        type="number"
                        step="0.01"
                        value={currentSplit.subtotal || ''}
                        onChange={(e) => setCurrentSplit(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="tax">Tax</Label>
                        <div className="flex gap-1">
                          <Button
                            variant={taxInputMode === 'amount' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTaxInputMode('amount')}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={taxInputMode === 'percentage' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTaxInputMode('percentage')}
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {taxInputMode === 'amount' ? (
                        <Input
                          id="tax"
                          type="number"
                          step="0.01"
                          value={currentSplit.tax_amount || ''}
                          onChange={(e) => setCurrentSplit(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      ) : (
                        <Input
                          id="taxPercentage"
                          type="number"
                          step="0.01"
                          value={taxPercentage || ''}
                          onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                          placeholder="8.5"
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="tip">Tip</Label>
                      <Input
                        id="tip"
                        type="number"
                        step="0.01"
                        value={currentSplit.tip_amount || ''}
                        onChange={(e) => setCurrentSplit(prev => ({ ...prev, tip_amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Quick Tip Selection */}
                  <div>
                    <Label>Quick Tip Selection</Label>
                    <div className="flex gap-2 mt-2">
                      <QuickTipButton percentage={15} />
                      <QuickTipButton percentage={18} />
                      <QuickTipButton percentage={20} />
                      <QuickTipButton percentage={22} />
                    </div>
                  </div>

                  {/* Number of People */}
                  <div>
                    <Label>Number of People</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateParticipants(Math.max(1, currentSplit.number_of_people - 1))}
                        disabled={currentSplit.number_of_people <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="text-2xl font-bold text-center min-w-[3rem]">
                        {currentSplit.number_of_people}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateParticipants(currentSplit.number_of_people + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Total Bill:</span>
                      <span className="text-2xl font-bold text-slate-900">${currentSplit.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Per Person:</span>
                      <span className="text-3xl font-bold text-green-600">${currentSplit.per_person_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={saveBillSplit}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={currentSplit.total_amount <= 0}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Split Bill & Send Requests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
            <CardHeader>
              <CardTitle>Recent Bill Splits</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSplits.length > 0 ? (
                <div className="space-y-4">
                  {recentSplits.map((split) => (
                    <SplitHistoryCard key={split.id} split={split} onUpdate={loadRecentSplits} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No bill splits yet. Create your first split!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <BillReceiptScanner
            onReceiptScanned={handleReceiptScanned}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Payment Request Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentRequestModal
            billSplit={currentSplit}
            onClose={() => setShowPaymentModal(false)}
            onRequestsSent={() => {
              setShowPaymentModal(false);
              resetCalculator();
              loadRecentSplits();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
