import { useRef, useState } from 'react';
import { Animated } from 'react-native';

export const useRouteAnimation = (duration: number = 500) => {
    const [animatedRoute, setAnimatedRoute] = useState<any>(null);
    const animationProgress = useRef(new Animated.Value(0)).current;

    const animateRoute = (fullRoute: any) => {
        if (!fullRoute?.geometry?.coordinates) return;

        const coordinates = fullRoute.geometry.coordinates;
        const totalPoints = coordinates.length;

        animationProgress.setValue(0);
        setAnimatedRoute({
            ...fullRoute,
            geometry: {
                ...fullRoute.geometry,
                coordinates: [coordinates[0]]
            }
        });

        Animated.timing(animationProgress, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        }).start();

        const listenerId = animationProgress.addListener(({ value }) => {
            const pointsToShow = Math.floor(value * totalPoints);
            const visibleCoordinates = coordinates.slice(0, Math.max(1, pointsToShow));

            setAnimatedRoute({
                ...fullRoute,
                geometry: {
                    ...fullRoute.geometry,
                    coordinates: visibleCoordinates
                }
            });
        });

        setTimeout(() => {
            animationProgress.removeListener(listenerId);
            setAnimatedRoute(fullRoute);
        }, duration);
    };

    const clearAnimation = () => setAnimatedRoute(null);

    return { animatedRoute, animateRoute, clearAnimation };
};