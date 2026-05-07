import { Feature, Polygon } from 'geojson';

export const distanceMeters = (
    [lng1, lat1]: [number, number],
    [lng2, lat2]: [number, number]
) => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isPointInPolygon = (
    lng: number,
    lat: number,
    boundary: Feature<Polygon>
): boolean => {
    const coords = boundary.geometry.coordinates[0];
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];

        const intersect = ((yi > lat) !== (yj > lat))
            && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

export const calculateDistance = (route: any): string => {
    if (!route?.geometry?.coordinates) return '';
    
    const coords = route.geometry.coordinates;
    let totalMeters = 0;
    
    for (let i = 0; i < coords.length - 1; i++) {
        totalMeters += distanceMeters(coords[i], coords[i + 1]);
    }
    
    if (totalMeters < 1000) {
        return `${Math.round(totalMeters)}m`;
    }
    return `${(totalMeters / 1000).toFixed(1)}km`;
};

export const calculateEstimatedTime = (distance: string): string => {
    const walkingSpeed = 5
    const distanceNum = parseFloat(distance);
    
    if (distance.includes('km')) {
        const hours = distanceNum / walkingSpeed;
        const minutes = Math.round(hours * 60);
        if (minutes < 60) return `${minutes} min`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    } else if (distance.includes('m')) {
        const km = distanceNum / 1000;
        const minutes = Math.round((km / walkingSpeed) * 60);
        return `${minutes} min`;
    }
    
    return '';
};