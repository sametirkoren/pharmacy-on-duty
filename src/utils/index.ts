/**
 * Validates latitude and longitude coordinates
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @throws Error if coordinates are invalid
 */
export function validateCoordinates(lat: number, lng: number): void {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Latitude and longitude must be numbers');
    }

    if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Latitude and longitude cannot be NaN');
    }

    if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
    }
}

/**
 * Calculates the distance between two coordinate pairs using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    // Validate all coordinates
    validateCoordinates(lat1, lng1);
    validateCoordinates(lat2, lng2);

    // Earth's radius in kilometers
    const R = 6371;

    // Convert degrees to radians
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in kilometers
    const distance = R * c;

    // Round to 2 decimal places
    return Math.round(distance * 100) / 100;
}

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}