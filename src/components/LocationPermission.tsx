'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserLocation } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface LocationPermissionProps {
  onLocationGranted: (location: UserLocation) => void;
  onLocationDenied: () => void;
}

export default function LocationPermission({ 
  onLocationGranted, 
  onLocationDenied 
}: LocationPermissionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');

  useEffect(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log('Geolocation not available');
      setPermissionStatus('unavailable');
      setError('Geolocation is not supported by this browser');
    } else {
      console.log('Geolocation is available');
      
      // Check current permission status if available
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('Current geolocation permission:', result.state);
          if (result.state === 'denied') {
            setPermissionStatus('denied');
            setError('Konum erişimi daha önce reddedilmiş. Tarayıcı ayarlarından konum iznini etkinleştirin.');
          }
        }).catch((err) => {
          console.log('Permission query failed:', err);
        });
      }
    }

    // Handle crypto wallet interference
    const handleError = (event: ErrorEvent) => {
      if (event.message && (event.message.includes('ethereum') || event.message.includes('selectedAddress'))) {
        console.warn('Crypto wallet interference detected, ignoring error');
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const requestLocation = async () => {
    console.log('requestLocation called');
    console.log('Navigator geolocation available:', !!navigator.geolocation);
    console.log('User agent:', navigator.userAgent);
    console.log('Is HTTPS:', window.location.protocol === 'https:');
    console.log('Location hostname:', window.location.hostname);
    console.log('Location origin:', window.location.origin);
    
    // Check HTTPS requirement for mobile
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('HTTPS required for geolocation on mobile');
      setError('Konum servisi için güvenli bağlantı (HTTPS) gereklidir. Lütfen sayfayı yenileyin.');
      onLocationDenied();
      return;
    }
    
    try {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        setError('Bu tarayıcı konum servisini desteklemiyor');
        onLocationDenied();
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log('Starting geolocation request...');

      // Try multiple approaches for better mobile compatibility
      const options1: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      };

      const options2: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0
      };

      console.log('Geolocation options (first attempt):', options1);

      // First attempt with low accuracy for faster response
      const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          console.log('Calling getCurrentPosition with options:', options);
          
          // Add user interaction check
          if (document.visibilityState === 'hidden') {
            console.log('Document is hidden, waiting...');
            reject(new Error('Document not visible'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Geolocation success:', position);
              console.log('Coordinates:', position.coords.latitude, position.coords.longitude);
              console.log('Accuracy:', position.coords.accuracy);
              resolve(position);
            },
            (error) => {
              console.log('Geolocation error:', error);
              console.log('Error code:', error.code);
              console.log('Error message:', error.message);
              console.log('Error PERMISSION_DENIED:', error.PERMISSION_DENIED);
              console.log('Error POSITION_UNAVAILABLE:', error.POSITION_UNAVAILABLE);
              console.log('Error TIMEOUT:', error.TIMEOUT);
              reject(error);
            },
            options
          );
        });
      };

      try {
        console.log('Attempting first geolocation request...');
        let position: GeolocationPosition;
        
        try {
          position = await getPosition(options1);
        } catch {
          console.log('First attempt failed, trying with high accuracy...');
          position = await getPosition(options2);
        }
        
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        console.log('LocationPermission: Location obtained:', location);
        setIsLoading(false);
        setPermissionStatus('granted');
        console.log('LocationPermission: Calling onLocationGranted');
        onLocationGranted(location);
        
      } catch (error: unknown) {
        console.log('All geolocation attempts failed:', error);
        setIsLoading(false);
        
        let errorMessage = 'Konumunuz alınamadı';
        
        if (error && typeof error === 'object' && 'code' in error) {
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından konum iznini etkinleştirin ve sayfayı yenileyin.';
              setPermissionStatus('denied');
              console.log('Permission denied by user');
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Konum bilgisi mevcut değil. GPS açık olduğundan ve internete bağlı olduğunuzdan emin olun.';
              console.log('Position unavailable');
              break;
            case 3: // TIMEOUT
              errorMessage = 'Konum isteği zaman aşımına uğradı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
              console.log('Geolocation timeout');
              break;
            default:
              errorMessage = 'Konum alınırken bilinmeyen bir hata oluştu. Lütfen sayfayı yenileyin.';
              console.log('Unknown geolocation error');
              break;
          }
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          console.log('Error message:', error.message);
          if (error.message.includes('secure')) {
            errorMessage = 'Konum servisi için güvenli bağlantı gereklidir. Lütfen HTTPS kullanın.';
          }
        }
        
        setError(errorMessage);
        onLocationDenied();
      }
      
    } catch (err) {
      // Catch any crypto wallet or other interference errors
      console.error('Geolocation request failed:', err);
      setIsLoading(false);
      setError('Konum servisi kullanılamıyor. Lütfen farklı bir tarayıcı deneyin veya konumu manuel olarak seçin.');
      onLocationDenied();
    }
  };

  if (permissionStatus === 'granted') {
    return (
      <div className="text-center p-4">
        <div className="text-green-600 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Konum erişimi verildi</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-8 text-center">
        <div className="mb-6">
          <Image 
            src="/pharmacy-marker.png" 
            alt="Nöbetçi Eczane" 
            width={80}
            height={80}
            className="w-20 h-20 mx-auto mb-4"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Yakındaki Nöbetçi Eczaneleri Bul
        </h2>
        <p className="text-gray-700 text-base leading-relaxed mb-6">
          Konumunuzu kullanarak size en yakın nöbetçi eczaneleri buluyoruz. 
          Hızlı, güvenli ve ücretsiz!
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
            <div className="text-green-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Hızlı Sonuç</h3>
            <p className="text-xs text-gray-600">Saniyeler içinde en yakın eczaneleri bulun</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Güvenli</h3>
            <p className="text-xs text-gray-600">Konum verileriniz saklanmaz</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
            <div className="text-purple-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Konum Tabanlı</h3>
            <p className="text-xs text-gray-600">GPS ile hassas konum tespiti</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Konum İzni Gerekli
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Size en yakın nöbetçi eczaneleri gösterebilmek için konumunuza erişim izni vermeniz gerekiyor. 
            Bu bilgi sadece arama yapmak için kullanılır ve hiçbir yerde saklanmaz.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-green-600 mr-3 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-800 text-sm mb-1">Neler Yapıyoruz?</h4>
                <p className="text-green-700 text-xs">
                  • En yakın 5 nöbetçi eczaneyi buluyoruz<br/>
                  • Mesafe ve yol tarifi bilgisi veriyoruz<br/>
                  • Telefon numaralarını paylaşıyoruz
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 text-sm mb-1">Gizlilik Garantisi</h4>
                <p className="text-blue-700 text-xs">
                  • Konum verileriniz saklanmaz<br/>
                  • Üçüncü taraflarla paylaşılmaz<br/>
                  • Sadece arama için kullanılır
                </p>
              </div>
            </div>
          </div>
        </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="text-red-400 mr-2 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={requestLocation}
          disabled={isLoading || permissionStatus === 'unavailable'}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center touch-manipulation min-h-[48px]"
        >
          {isLoading ? (
            <LoadingSpinner 
              size="md" 
              color="white" 
              text="Konumunuz alınıyor..."
            />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Konumumu Kullan
            </>
          )}
        </button>

        {(permissionStatus === 'denied' || permissionStatus === 'unavailable' || error) && (
          <button
            onClick={onLocationDenied}
            className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-all duration-200 touch-manipulation min-h-[48px] flex items-center justify-center"
          >
            Konumu Manuel Seç
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>🔒 Gizliliğiniz korunmaktadır. Konum verileri saklanmaz.</p>
      </div>
      </div>
    </div>
  );
}