import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationCheckIn } from '@/api/entities';
import { FamilyMember } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Home, 
  Briefcase, 
  ShoppingBag, 
  Coffee,
  School,
  Hospital,
  Loader2,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const locationPresets = [
  { name: 'Home', emoji: '🏠', icon: Home },
  { name: 'Work', emoji: '💼', icon: Briefcase },
  { name: 'School', emoji: '🏫', icon: School },
  { name: 'Shopping', emoji: '🛍️', icon: ShoppingBag },
  { name: 'Coffee Shop', emoji: '☕', icon: Coffee },
  { name: 'Hospital', emoji: '🏥', icon: Hospital },
  { name: 'Gym', emoji: '💪', icon: MapPin },
  { name: 'Restaurant', emoji: '🍽️', icon: MapPin },
  { name: 'Park', emoji: '🌳', icon: MapPin },
  { name: 'Other', emoji: '📍', icon: MapPin }
];

// Custom marker component
const createCustomIcon = (emoji, color = '#3B82F6') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        background: ${color};
        border: 4px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        animation: bounce 2s infinite;
      ">
        <span style="
          font-size: 24px;
          transform: rotate(45deg);
        ">${emoji}</span>
      </div>
      <style>
        @keyframes bounce {
          0%, 100% { transform: rotate(-45deg) translateY(0); }
          50% { transform: rotate(-45deg) translateY(-10px); }
        }
      </style>
    `,
    iconSize: [50, 50],
    iconAnchor: [15, 50],
    popupAnchor: [10, -45]
  });
};

// Component to re-center map
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13, { animate: true });
    }
  }, [position, map]);
  return null;
};

export default function FamilyMap() {
  const [checkIns, setCheckIns] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]); // Default: San Francisco
  
  const [checkInForm, setCheckInForm] = useState({
    location_name: '',
    emoji: '📍',
    note: ''
  });

  useEffect(() => {
    loadData();
    // Get user's current location for map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Location permission denied, using default location');
        }
      );
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, memberData, checkInData] = await Promise.all([
        User.me(),
        FamilyMember.list(),
        LocationCheckIn.list('-check_in_time', 50)
      ]);
      setCurrentUser(user);
      setMembers(memberData);
      setCheckIns(checkInData);
    } catch (error) {
      console.error('Failed to load map data:', error);
      toast.error('Failed to load family locations');
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberById = (id) => members.find(m => m.id === id);

  const getLatestCheckInPerMember = () => {
    const latestCheckIns = {};
    checkIns.forEach(checkIn => {
      if (!latestCheckIns[checkIn.family_member_id] || 
          new Date(checkIn.check_in_time) > new Date(latestCheckIns[checkIn.family_member_id].check_in_time)) {
        latestCheckIns[checkIn.family_member_id] = checkIn;
      }
    });
    return Object.values(latestCheckIns);
  };

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setIsGettingLocation(false);
          setShowCheckInModal(true);
        },
        (error) => {
          toast.error('Unable to get your location. Please enable location services.');
          setIsGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  const handleLocationPresetClick = (preset) => {
    setCheckInForm(prev => ({
      ...prev,
      location_name: preset.name,
      emoji: preset.emoji
    }));
  };

  const handleCheckIn = async () => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }
    if (!checkInForm.location_name) {
      toast.error('Please select a location type');
      return;
    }

    try {
      // Find or create a FamilyMember profile for the current user
      let familyMember = members.find(m => m.name === currentUser.full_name);
      if (!familyMember) {
        familyMember = await FamilyMember.create({
          name: currentUser.full_name,
          role: 'parent',
          avatar_url: `https://avatar.vercel.sh/${currentUser.email}.png`,
          age: 30
        });
      }

      await LocationCheckIn.create({
        family_member_id: familyMember.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_name: checkInForm.location_name,
        emoji: checkInForm.emoji,
        note: checkInForm.note,
        check_in_time: new Date().toISOString()
      });

      toast.success(`Checked in at ${checkInForm.location_name}!`);
      setShowCheckInModal(false);
      setCheckInForm({ location_name: '', emoji: '📍', note: '' });
      setCurrentLocation(null);
      loadData();
    } catch (error) {
      console.error('Failed to check in:', error);
      toast.error('Failed to check in. Please try again.');
    }
  };

  const getMemberColor = (memberId) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const index = members.findIndex(m => m.id === memberId);
    return colors[index % colors.length];
  };

  const latestCheckIns = getLatestCheckInPerMember();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap position={mapCenter} />
        
        {/* Render markers for each family member's latest check-in */}
        {latestCheckIns.map((checkIn) => {
          const member = getMemberById(checkIn.family_member_id);
          if (!member) return null;
          
          return (
            <Marker
              key={checkIn.id}
              position={[checkIn.latitude, checkIn.longitude]}
              icon={createCustomIcon(checkIn.emoji, getMemberColor(member.id))}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-600">{checkIn.location_name}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs mb-2">
                    {formatDistanceToNow(new Date(checkIn.check_in_time), { addSuffix: true })}
                  </Badge>
                  {checkIn.note && (
                    <p className="text-sm text-slate-700 mt-2 italic">"{checkIn.note}"</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none"
      >
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl pointer-events-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Family Map
                </h1>
                <p className="text-sm text-slate-600">See where everyone is</p>
              </div>
              <Button
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                size="lg"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Navigation className="w-5 h-5 mr-2" />
                )}
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Family Members List */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="absolute bottom-4 left-4 z-[1000] pointer-events-none"
      >
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl w-64 pointer-events-auto">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Family Members</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-2">
              {latestCheckIns.map((checkIn) => {
                const member = getMemberById(checkIn.family_member_id);
                if (!member) return null;
                
                return (
                  <div
                    key={checkIn.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setMapCenter([checkIn.latitude, checkIn.longitude])}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getMemberColor(member.id) }}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{member.name}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {checkIn.emoji} {checkIn.location_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(checkIn.check_in_time), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {latestCheckIns.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No check-ins yet. Be the first!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Check-In Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
            onClick={() => setShowCheckInModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-slate-900">Check In</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCheckInModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Where are you?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {locationPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant={checkInForm.location_name === preset.name ? 'default' : 'outline'}
                        className="h-20 flex flex-col items-center justify-center gap-2"
                        onClick={() => handleLocationPresetClick(preset)}
                      >
                        <span className="text-2xl">{preset.emoji}</span>
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="note">Add a note (optional)</Label>
                  <Input
                    id="note"
                    placeholder="e.g., Getting groceries, be back soon!"
                    value={checkInForm.note}
                    onChange={(e) => setCheckInForm(prev => ({ ...prev, note: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleCheckIn}
                  disabled={!checkInForm.location_name}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Check In at {checkInForm.location_name || 'Location'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}