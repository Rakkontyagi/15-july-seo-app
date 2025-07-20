'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MapPin, 
  Search,
  Check,
  ChevronDown
} from 'lucide-react';

interface Location {
  code: string;
  name: string;
  flag: string;
  language: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
}

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  showMetrics?: boolean;
}

const popularLocations: Location[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    language: 'English',
    searchVolume: 100,
    competition: 'high'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    language: 'English',
    searchVolume: 85,
    competition: 'high'
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    language: 'English',
    searchVolume: 75,
    competition: 'medium'
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    language: 'English',
    searchVolume: 70,
    competition: 'medium'
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    language: 'German',
    searchVolume: 90,
    competition: 'high'
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    language: 'French',
    searchVolume: 85,
    competition: 'high'
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    language: 'Spanish',
    searchVolume: 80,
    competition: 'medium'
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    language: 'Italian',
    searchVolume: 75,
    competition: 'medium'
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    language: 'Japanese',
    searchVolume: 95,
    competition: 'high'
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    language: 'Portuguese',
    searchVolume: 85,
    competition: 'medium'
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    language: 'English/Hindi',
    searchVolume: 90,
    competition: 'low'
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    language: 'Spanish',
    searchVolume: 70,
    competition: 'low'
  }
];

export function LocationSelector({ value, onChange, showMetrics = true }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedLocation = popularLocations.find(loc => loc.code === value);
  
  const filteredLocations = popularLocations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationSelect = (locationCode: string) => {
    onChange(locationCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCompetitionColor = (competition: 'low' | 'medium' | 'high') => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Target Location *
        </label>
        
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              {selectedLocation ? (
                <>
                  <span className="mr-2">{selectedLocation.flag}</span>
                  {selectedLocation.name}
                </>
              ) : (
                'Select location'
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isOpen && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1">
              <CardContent className="p-0">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {filteredLocations.map((location) => (
                    <div
                      key={location.code}
                      className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleLocationSelect(location.code)}
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-lg mr-3">{location.flag}</span>
                        <div>
                          <div className="font-medium text-sm">{location.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.language}
                          </div>
                        </div>
                      </div>
                      
                      {showMetrics && (
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-muted-foreground">
                            {location.searchVolume}% vol
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getCompetitionColor(location.competition)}
                          >
                            {location.competition}
                          </Badge>
                        </div>
                      )}
                      
                      {value === location.code && (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Location Insights */}
      {selectedLocation && showMetrics && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location Insights
              </h4>
              <Badge className={getCompetitionColor(selectedLocation.competition)}>
                {selectedLocation.competition} competition
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Primary Language</div>
                <div className="font-medium">{selectedLocation.language}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Search Volume Index</div>
                <div className="font-medium">{selectedLocation.searchVolume}%</div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Tip:</strong> Content will be optimized for {selectedLocation.name} search patterns and user behavior.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
