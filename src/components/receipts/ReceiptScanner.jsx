
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { Receipt as ReceiptEntity } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  "groceries", "dining", "shopping", "utilities", "healthcare", 
  "transportation", "entertainment", "education", "household", "other"
];

export default function ReceiptScanner({ onReceiptProcessed, onClose }) {
  const [step, setStep] = useState('capture'); // 'capture', 'processing', 'review', 'saving'
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Helper to stop camera stream and reset related states
  const stopStreamAndResetState = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const initializeCamera = async () => {
      if (showCamera) {
        try {
          setIsCameraReady(false);
          setError(null);

          // Prefer environment camera with high resolution for better OCR
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 }, // Higher resolution
              height: { ideal: 1080 }
            }
          });

          streamRef.current = stream;
          const video = videoRef.current;

          if (video) {
            video.srcObject = stream;
            // Use oncanplay to ensure video metadata is loaded and it's ready to play
            video.oncanplay = () => {
              video.play().then(() => {
                setIsCameraReady(true);
              }).catch(e => {
                console.error("Video play failed:", e);
                setError("Could not start camera preview. Please check browser autoplay settings.");
                stopStreamAndResetState();
                setShowCamera(false); // Hide camera view if play fails
              });
            };
          }
        } catch (err) {
          console.error("Camera initialization failed:", err);
          setError("Failed to access camera. Please ensure you've granted camera permissions for this site in your browser settings, or try uploading an image.");
          stopStreamAndResetState();
          setShowCamera(false); // Hide camera view on initialization error
        }
      } else {
        // If showCamera is false, ensure stream is stopped
        stopStreamAndResetState();
      }
    };

    initializeCamera();

    // Cleanup function for useEffect: stops stream when component unmounts or showCamera changes to false
    return () => {
      stopStreamAndResetState();
    };
  }, [showCamera]); // Dependency array: re-run when showCamera state changes

  const stopAndCloseCamera = () => {
    stopStreamAndResetState();
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video to avoid stretching
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // Draw the video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas content to blob (file) and data URL (preview)
    canvas.toBlob((blob) => {
      if (blob) { // Ensure blob is successfully created
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedImage({ file, preview: canvas.toDataURL('image/jpeg', 0.8) }); // Specify format and quality
        stopAndCloseCamera(); // Stop camera stream and hide camera view
        setStep('processing');
        processReceipt(file);
      } else {
        setError('Failed to capture image. Please try again.');
        console.error('Canvas toBlob failed');
      }
    }, 'image/jpeg', 0.8); // Specify output format and quality
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage({ file, preview: e.target.result });
        setStep('processing');
        processReceipt(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async (file) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Upload the image
      const { file_url } = await UploadFile({ file });

      // Extract receipt data using AI
      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            store_name: { type: "string", description: "Name of the store or business" },
            amount: { type: "number", description: "Total amount on receipt" },
            date: { type: "string", description: "Date of purchase in YYYY-MM-DD format" },
            category: { 
              type: "string", 
              enum: CATEGORIES,
              description: "Best category match for this purchase"
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "number" }
                }
              }
            },
            currency: { type: "string", description: "Currency code (e.g., USD)" },
            tax_amount: { type: "number", description: "Tax amount if visible" },
            subtotal: { type: "number", description: "Subtotal before tax if visible" }
          },
          required: ["store_name", "amount", "date"]
        }
      });

      if (result.status === 'success' && result.output) {
        setExtractedData({
          ...result.output,
          image_url: file_url,
          status: 'approved',
          tags: []
        });
        setStep('review');
      } else {
        throw new Error(result.details || 'Failed to extract data from receipt');
      }
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError('Failed to process receipt. Please try again or enter details manually.');
      setStep('capture');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataChange = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setExtractedData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const addItem = () => {
    setExtractedData(prev => ({
      ...prev,
      items: [...(prev.items || []), { name: '', price: 0, quantity: 1 }]
    }));
  };

  const removeItem = (index) => {
    setExtractedData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  };

  const saveReceipt = async () => {
    setStep('saving');
    try {
      await onReceiptProcessed(extractedData);
    } catch (err) {
      setError('Failed to save receipt. Please try again.');
      setStep('review');
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setError(null);
    setStep('capture');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ height: '100vh', overflow: 'auto' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {step === 'capture' && 'Scan Receipt'}
            {step === 'processing' && 'Processing Receipt'}
            {step === 'review' && 'Review Receipt Data'}
            {step === 'saving' && 'Saving Receipt'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {/* Capture Step */}
          {step === 'capture' && (
            <div className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!showCamera ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Camera Option */}
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200" onClick={() => setShowCamera(true)}>
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Use Camera</h3>
                      <p className="text-slate-600">Take a photo of your receipt</p>
                    </CardContent>
                  </Card>

                  {/* Upload Option */}
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-200" onClick={() => fileInputRef.current?.click()}>
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                      <p className="text-slate-600">Choose from your device</p>
                    </CardContent>
                  </Card>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '600px', aspectRatio: '4/3' }}>
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>Starting camera...</p>
                        </div>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isCameraReady ? 'block' : 'none' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Camera overlay guide */}
                    {isCameraReady && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white rounded-lg opacity-50"></div>
                        <div className="absolute top-4 left-4 right-4 text-center">
                          <p className="text-white text-sm bg-black/50 rounded px-2 py-1 inline-block">
                            Position receipt within the frame
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={stopAndCloseCamera}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={capturePhoto} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!isCameraReady}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isCameraReady ? 'Capture Receipt' : 'Starting...'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="p-6">
              <div className="text-center py-12">
                {capturedImage && (
                  <img 
                    src={capturedImage.preview} 
                    alt="Captured receipt" 
                    className="w-48 h-64 object-cover rounded-lg mx-auto mb-6 shadow-lg"
                  />
                )}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg font-medium">Processing receipt...</span>
                </div>
                <p className="text-slate-600">Our AI is extracting the receipt data. This may take a few moments.</p>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && extractedData && (
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {capturedImage && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Receipt Image</Label>
                    <img 
                      src={capturedImage.preview} 
                      alt="Receipt" 
                      className="w-full max-w-sm rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_name">Store Name</Label>
                      <Input
                        id="store_name"
                        value={extractedData.store_name || ''}
                        onChange={(e) => handleDataChange('store_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Total Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={extractedData.amount || ''}
                        onChange={(e) => handleDataChange('amount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={extractedData.date || ''}
                        onChange={(e) => handleDataChange('date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={extractedData.category || ''} onValueChange={(value) => handleDataChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Items */}
                  {extractedData.items && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Items</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {extractedData.items.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center p-2 border rounded">
                            <Input
                              placeholder="Item name"
                              value={item.name || ''}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={item.price || ''}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                              className="w-20"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                        Add Item
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saving Step */}
          {step === 'saving' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  <span className="text-lg font-medium">Saving receipt...</span>
                </div>
                <p className="text-slate-600">Adding your receipt to the family expenses.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === 'review' && (
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-white rounded-b-2xl">
            <Button variant="outline" onClick={retryCapture}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button onClick={saveReceipt} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Receipt
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
