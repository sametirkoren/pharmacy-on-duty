'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CitiesResponse, DistrictsResponse } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface CityDistrictSelectorProps {
    onSelectionComplete: (city: string, district: string) => void;
}

type Country = 'turkey' | 'cyprus';



export default function CityDistrictSelector({ onSelectionComplete }: CityDistrictSelectorProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load cities when country is selected
    useEffect(() => {
        if (selectedCountry) {
            if (selectedCountry === 'turkey') {
                loadCities();
            } else if (selectedCountry === 'cyprus') {
                // For Cyprus, directly load districts (no city selection needed)
                loadDistricts('kibris');
                setSelectedCity('kibris'); // Set Cyprus as the default city
            }
        }
    }, [selectedCountry]);

    // Load districts when city changes
    useEffect(() => {
        if (selectedCity) {
            loadDistricts(selectedCity);
            setSelectedDistrict(''); // Reset district selection
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedCity]);

    const loadCities = async () => {
        try {
            setIsLoadingCities(true);
            setError(null);

            const response = await fetch('/api/cities');
            const data: CitiesResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load cities');
            }

            if (data.success && data.data) {
                setCities(data.data);
            } else {
                throw new Error(data.error || 'No cities data received');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load cities';
            setError(errorMessage);
            console.error('Error loading cities:', err);
        } finally {
            setIsLoadingCities(false);
        }
    };

    const loadDistricts = async (city: string) => {
        try {
            setIsLoadingDistricts(true);
            setError(null);

            const response = await fetch(`/api/districts?city=${encodeURIComponent(city)}`);
            const data: DistrictsResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load districts');
            }

            if (data.success && data.data) {
                setDistricts(data.data);
            } else {
                throw new Error(data.error || 'No districts data received');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load districts';
            setError(errorMessage);
            console.error('Error loading districts:', err);
        } finally {
            setIsLoadingDistricts(false);
        }
    };

    const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value;
        setSelectedCity(city);
    };

    const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const district = event.target.value;
        setSelectedDistrict(district);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedCity || !selectedDistrict) {
            setError('Lütfen hem şehir hem de ilçe seçin');
            return;
        }

        // Send lowercase city name to API but keep capitalized for display
        const cityForApi = selectedCity.toLowerCase();
        onSelectionComplete(cityForApi, selectedDistrict);
    };

    const isFormValid = selectedCity && selectedDistrict;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl p-8 sm:p-12 mb-8 text-center shadow-xl border border-blue-100">
                <div className="mb-8">
                    <div className="relative inline-block">
                        <Image
                            src="/pharmacy-marker.png"
                            alt="Nöbetçi Eczane"
                            width={128}
                            height={128}
                            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 drop-shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        Yakındaki Nöbetçi Eczaneleri Bul
                    </h2>
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        Yakındaki nöbetçi eczaneleri bulmak için şehir ve ilçenizi seçin.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
                        <div className="text-green-600 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-1">Hızlı Sonuç</h3>
                        <p className="text-xs text-gray-600">Saniyeler içinde en yakın eczaneleri bulun</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm">
                        <div className="text-blue-600 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-1">7/24 Güncel</h3>
                        <p className="text-xs text-gray-600">Her zaman güncel nöbetçi bilgileri</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
                        <div className="text-purple-600 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-1">Harita Desteği</h3>
                        <p className="text-xs text-gray-600">İnteraktif harita ile kolay navigasyon</p>
                    </div>
                </div>
            </div>

            {/* Selection Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 4h2M7 7h.01M7 11h.01M7 15h.01" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Konumunuzu Seçin
                    </h3>
                    <p className="text-gray-600 text-sm">
                        Bölgenizdeki tüm nöbetçi eczaneleri görmek için ülke ve konumunuzu seçin
                    </p>
                </div>

                {/* Country Selection */}
                {!selectedCountry && (
                    <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-4 text-center">Ülke Seçin</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Turkey */}
                            <button
                                type="button"
                                onClick={() => setSelectedCountry('turkey')}
                                className="p-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl mb-3">🇹🇷</div>
                                    <h5 className="font-semibold text-gray-800 group-hover:text-blue-600">Türkiye</h5>
                                    <p className="text-sm text-gray-600 mt-1">Türkiye&apos;deki nöbetçi eczaneler</p>
                                </div>
                            </button>

                            {/* Cyprus */}
                            <button
                                type="button"
                                onClick={() => setSelectedCountry('cyprus')}
                                className="p-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl mb-3">🇨🇾</div>
                                    <h5 className="font-semibold text-gray-800 group-hover:text-blue-600">Kıbrıs</h5>
                                    <p className="text-sm text-gray-600 mt-1">Kıbrıs&apos;taki nöbetçi eczaneler</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Country Display */}
                {selectedCountry && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-3xl mr-3">
                                    {selectedCountry === 'turkey' ? '🇹🇷' : '🇨🇾'}
                                </span>
                                <div>
                                    <h5 className="font-semibold text-blue-800">
                                        {selectedCountry === 'turkey' ? 'Türkiye' : 'Kıbrıs'}
                                    </h5>
                                    <p className="text-sm text-blue-600">Seçili ülke</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCountry(null);
                                    setSelectedCity('');
                                    setSelectedDistrict('');
                                    setCities([]);
                                    setDistricts([]);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                                Değiştir
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                            <div className="text-red-400 mr-2 mt-0.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-red-700">{error}</p>
                                {(error.includes('Failed to load') || error.includes('Network error') || error.includes('Server error')) && (
                                    <button
                                        onClick={error.includes('cities') || error.includes('Network error') || error.includes('Server error') ? loadCities : () => selectedCity && loadDistricts(selectedCity)}
                                        className="text-sm text-red-600 underline hover:text-red-800 mt-1"
                                    >
                                        Tekrar dene
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* City Selection - Only show for Turkey */}
                    {selectedCountry === 'turkey' && (
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                Şehir
                            </label>
                            <div className="relative">
                                <select
                                    id="city"
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    disabled={isLoadingCities}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 font-semibold"
                                    required
                                >
                                    <option value="">
                                        {isLoadingCities ? 'Şehirler yükleniyor...' : 'Bir şehir seçin'}
                                    </option>
                                    {cities.filter(city => city !== 'kibris').map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                                {isLoadingCities && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <LoadingSpinner size="sm" color="gray" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* District Selection */}
                    <div>
                        <label htmlFor="district" className="block text-base font-bold text-gray-900 mb-2">
                            İlçe
                        </label>
                        <div className="relative">
                            <select
                                id="district"
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedCity || isLoadingDistricts}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 font-semibold"
                                required
                            >
                                <option value="">
                                    {!selectedCity
                                        ? (selectedCountry === 'cyprus' ? 'İlçeler yükleniyor...' : 'Önce bir şehir seçin')
                                        : isLoadingDistricts
                                            ? 'İlçeler yükleniyor...'
                                            : 'Bir ilçe seçin'
                                    }
                                </option>
                                {districts.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                            {isLoadingDistricts && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <LoadingSpinner size="sm" color="gray" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!isFormValid || isLoadingCities || isLoadingDistricts}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center touch-manipulation min-h-[48px]"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Eczaneleri Bul
                    </button>
                </form>

                {/* Help Text */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                    <p>Bölgenizdeki tüm nöbetçi eczaneleri görmek için konumunuzu seçin</p>
                </div>
            </div>
        </div>
    );
}