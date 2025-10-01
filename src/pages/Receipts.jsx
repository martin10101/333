import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt as ReceiptEntity } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  Upload, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Store,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt
} from "lucide-react";
import { format } from "date-fns";

import ReceiptScanner from "../components/receipts/ReceiptScanner";
import ReceiptCard from "../components/receipts/ReceiptCard";
import ReceiptFilters from "../components/receipts/ReceiptFilters";

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    dateRange: "all",
    minAmount: "",
    maxAmount: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    avgAmount: 0
  });

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [receipts, searchTerm, filters]);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await ReceiptEntity.list('-created_date');
      setReceipts(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
    setIsLoading(false);
  };

  const calculateStats = (receiptData) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const total = receiptData.reduce((sum, r) => sum + (r.amount || 0), 0);
    const thisMonthAmount = receiptData
      .filter(r => new Date(r.date) >= thisMonth)
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    const thisWeekAmount = receiptData
      .filter(r => new Date(r.date) >= thisWeek)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    setStats({
      total,
      thisMonth: thisMonthAmount,
      thisWeek: thisWeekAmount,
      avgAmount: receiptData.length ? total / receiptData.length : 0
    });
  };

  const applyFilters = () => {
    let filtered = [...receipts];

    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(receipt => receipt.category === filters.category);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(receipt => receipt.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(receipt => receipt.amount <= parseFloat(filters.maxAmount));
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      let cutoffDate;
      
      switch (filters.dateRange) {
        case "week":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(receipt => new Date(receipt.date) >= cutoffDate);
      }
    }

    setFilteredReceipts(filtered);
  };

  const handleReceiptProcessed = async (receiptData) => {
    try {
      await ReceiptEntity.create(receiptData);
      setShowScanner(false);
      loadReceipts();
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };

  const handleDeleteReceipt = async (receiptId) => {
    try {
      await ReceiptEntity.delete(receiptId);
      loadReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, format = "currency" }) => (
    <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">
              {format === "currency" ? `$${value.toFixed(2)}` : Math.round(value)}
            </p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Receipts & Expenses</h1>
          <p className="text-slate-600">Track and manage your family's spending with smart receipt scanning.</p>
        </div>
        <Button 
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="lg"
        >
          <Camera className="w-5 h-5 mr-2" />
          Scan Receipt
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          title="Total Expenses"
          value={stats.total}
          icon={DollarSign}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="This Month"
          value={stats.thisMonth}
          icon={Calendar}
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="This Week"
          value={stats.thisWeek}
          icon={Calendar}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Average Receipt"
          value={stats.avgAmount}
          icon={Store}
          color="from-orange-500 to-orange-600"
        />
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search receipts by store, category, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ReceiptFilters filters={filters} onFiltersChange={setFilters} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <ReceiptScanner
            onReceiptProcessed={handleReceiptProcessed}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Receipts Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReceipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredReceipts.map((receipt, index) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  index={index}
                  onDelete={() => handleDeleteReceipt(receipt.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {searchTerm || filters.category !== "all" ? "No receipts found" : "No receipts yet"}
              </h3>
              <p className="text-slate-600 mb-8">
                {searchTerm || filters.category !== "all" 
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Start by scanning your first receipt using the camera feature."
                }
              </p>
              {!searchTerm && filters.category === "all" && (
                <Button 
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan Your First Receipt
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}