import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FamilyTrip } from '@/api/entities';
import { FamilyGoal } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, 
  Calendar, 
  DollarSign, 
  MapPin, 
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  Sparkles,
  Hotel,
  Car
} from 'lucide-react';
import { format } from 'date-fns';
import { InvokeLLM } from '@/api/integrations';
import { toast } from 'sonner';

export default function TravelPlanningPage() {
  const location = useLocation();
  const tripId = new URLSearchParams(location.search).get('id');
  
  const [trip, setTrip] = useState(null);
  const [goal, setGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);

  useEffect(() => {
    const loadTripData = async () => {
      if (!tripId) {
        setError('No trip ID provided');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading trip with ID:', tripId);
        const tripData = await FamilyTrip.get(tripId);
        console.log('Trip data loaded:', tripData);
        
        if (tripData.goal_id) {
          const goalData = await FamilyGoal.get(tripData.goal_id);
          console.log('Goal data loaded:', goalData);
          setGoal(goalData);
        }
        
        setTrip(tripData);
      } catch (error) {
        console.error('Error loading trip:', error);
        setError(error.message || 'Failed to load trip data');
        toast.error('Failed to load trip data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTripData();
  }, [tripId]);

  const askAI = async (question) => {
    if (!trip) return;
    
    setIsAskingAI(true);
    try {
      const startDate = format(new Date(trip.start_date), 'MMM d, yyyy');
      const endDate = format(new Date(trip.end_date), 'MMM d, yyyy');
      const startMonth = format(new Date(trip.start_date), 'MMMM');
      
      const response = await InvokeLLM({
        prompt: `You are a helpful family travel assistant. The family is planning a trip to ${trip.destination} from ${startDate} to ${endDate}. 
        
User question: ${question}

Provide helpful, family-friendly recommendations. Be concise but informative.`,
        add_context_from_internet: true
      });
      
      setAiMessage(response);
      toast.success('AI Travel Assistant responded!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsAskingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500">Loading trip...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Trip Not Found</h2>
          <p className="text-slate-600 mb-4">
            {error || 'We couldn\'t find this trip. It may have been deleted or the link is incorrect.'}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Trip ID: {tripId || 'Not provided'}
          </p>
          <Button onClick={() => window.location.href = '/Goals'} className="bg-blue-600 hover:bg-blue-700">
            Back to Goals
          </Button>
        </div>
      </div>
    );
  }

  const tripDuration = Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24));
  const startDateFormatted = format(new Date(trip.start_date), 'MMM d');
  const endDateFormatted = format(new Date(trip.end_date), 'MMM d, yyyy');
  const startMonth = format(new Date(trip.start_date), 'MMMM');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl mb-8"
      >
        <img
          src={goal?.image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074'}
          alt={trip.destination}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-8 h-8" />
            <Badge className="bg-blue-500">Planning</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-2">{trip.destination} Adventure</h1>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {startDateFormatted} - {endDateFormatted}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {trip.participants?.length || 0} Travelers
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ${trip.budget?.total?.toLocaleString()} Budget
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Travel Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => askAI(`What are the best family-friendly attractions in ${trip.destination}?`)}
                  disabled={isAskingAI}
                >
                  Best Attractions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => askAI(`What's the weather like in ${trip.destination} during ${startMonth}?`)}
                  disabled={isAskingAI}
                >
                  Weather Info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => askAI(`Suggest a ${tripDuration}-day itinerary for ${trip.destination} for a family`)}
                  disabled={isAskingAI}
                >
                  Create Itinerary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => askAI(`What should we pack for ${trip.destination} in ${startMonth}?`)}
                  disabled={isAskingAI}
                >
                  Packing Tips
                </Button>
              </div>
              
              {isAskingAI && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}
              
              {aiMessage && !isAskingAI && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white rounded-lg p-4 border shadow-sm"
                >
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiMessage}</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="accommodation">Hotels</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Budget:</span>
                    <span className="font-bold">${trip.budget?.total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Spent:</span>
                    <span className="font-bold text-red-600">${trip.budget?.spent?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Remaining:</span>
                    <span className="font-bold text-green-600">
                      ${((trip.budget?.total || 0) - (trip.budget?.spent || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-600 text-sm">Duration:</span>
                    <p className="font-semibold">{tripDuration} days</p>
                  </div>
                  <div>
                    <span className="text-slate-600 text-sm">Status:</span>
                    <Badge className="ml-2">{trip.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                  Travelers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-2">
                  {trip.participants?.length || 0} family members
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Travelers
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Plane className="w-6 h-6" />
                  <span className="text-sm">Book Flights</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Hotel className="w-6 h-6" />
                  <span className="text-sm">Book Hotel</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Car className="w-6 h-6" />
                  <span className="text-sm">Rent Car</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <MapPin className="w-6 h-6" />
                  <span className="text-sm">Find Activities</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary">
          <Card>
            <CardHeader>
              <CardTitle>Trip Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No itinerary yet. Let AI help you create one!</p>
                <Button onClick={() => askAI(`Create a detailed ${tripDuration}-day itinerary for a family trip to ${trip.destination}`)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Itinerary with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No flights booked yet</p>
                <Button>Add Flight Details</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accommodation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                Accommodation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Hotel className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No accommodation booked yet</p>
                <Button>Add Hotel Details</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Packing Lists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No packing list yet</p>
                <Button onClick={() => askAI(`What should we pack for a family trip to ${trip.destination} in ${startMonth}? Give me a comprehensive packing list.`)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Packing List with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Travel Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="mb-4">No documents uploaded yet</p>
                <Button>Upload Document</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}