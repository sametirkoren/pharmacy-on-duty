'use client';

import React from 'react';
import { PharmacyWithDistance } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Phone, 
  MapPin, 
  Navigation, 
  Share2, 
  Map,
  Clock,
  Bookmark
} from 'lucide-react';

interface PharmacyCardProps {
  pharmacy: PharmacyWithDistance;
  onShowMap?: () => void;
  onSave?: (pharmacy: PharmacyWithDistance) => void;
  isSaved?: boolean;
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, onShowMap, onSave, isSaved }) => {
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  const handlePhoneClick = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleDirectionsClick = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleWhatsAppShare = () => {
    const message = `💊 *NÖBETÇI ECZANE BİLGİSİ*
━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 *${pharmacy.pharmacy}*

📍 *Adres:*
${pharmacy.address}
${pharmacy.district} / ${pharmacy.city}

📞 *Telefon:* ${pharmacy.phone}
📏 *Mesafe:* ${formatDistance(pharmacy.distance)}

━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ *Yol Tarifi:*
${`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}

✅ *Bugün nöbetçi eczane!*
🕐 *7/24 hizmet veriyor*

_Nöbetçi Eczane Bulucu uygulamasından paylaşıldı_`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl text-gray-900 leading-tight">
            {pharmacy.pharmacy}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pharmacy.distance > 0 && (
              <Badge variant="default" className="gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(pharmacy.distance)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address Section */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 bg-white rounded-full shadow-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 break-words">
              {pharmacy.address}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {pharmacy.district}, {pharmacy.city}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="success"
            size="default"
            onClick={() => handlePhoneClick(pharmacy.phone)}
            className="col-span-2 sm:col-span-1"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Ara</span>
            <span className="sm:hidden">{formatPhone(pharmacy.phone)}</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleDirectionsClick}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Navigation className="w-4 h-4" />
            <span>Yol Tarifi</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleWhatsAppShare}
            className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
          >
            <Share2 className="w-4 h-4" />
            <span>Paylaş</span>
          </Button>

          {onSave && (
            <Button
              variant="outline"
              size="default"
              onClick={() => onSave(pharmacy)}
              className={isSaved 
                ? "text-green-600 border-green-300 bg-green-50 hover:bg-green-100" 
                : "text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
            </Button>
          )}

          {onShowMap && (
            <Button
              variant="outline"
              size="default"
              onClick={onShowMap}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <Map className="w-4 h-4" />
              <span>Harita</span>
            </Button>
          )}
        </div>

        {/* On-duty Indicator */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 rounded-lg border border-green-100">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Bugün Nöbetçi • 7/24 Açık</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyCard;
