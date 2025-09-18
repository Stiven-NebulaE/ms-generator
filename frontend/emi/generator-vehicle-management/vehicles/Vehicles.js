import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import withReducer from 'app/store/withReducer';
import { FuseLoading } from '@fuse';
import { useMutation, useQuery, useSubscription } from '@apollo/react-hooks';
import { Box } from '@material-ui/core';
import { VehicleMngStartGeneration, VehicleMngStopGeneration, VehicleMngGenerationStatus, VehicleGeneratedSubscription } from '../gql/Vehicle';
import VehiclesHeader from './VehiclesHeader';
import VehiclesTable from './VehiclesTable';
import reducer from '../store/reducers';

// Constants for better maintainability
const CONFIG = {
    UI_UPDATE_INTERVAL: 1000, // 1 second debounce
    MAX_VEHICLES_IN_MEMORY: 1000, // Performance optimization
    STATUS_POLL_INTERVAL: 1000,
};

const formatTimestamp = (timestamp) => new Date(timestamp).toISOString();

function Vehicles() {
    const user = useSelector(({ auth }) => auth.user);
    const [vehicles, setVehicles] = useState([]);
    const [totalVehicles, setTotalVehicles] = useState(0);
    const [displayVehicles, setDisplayVehicles] = useState([]);
    const lastRenderTime = useRef(0);

    // GraphQL queries and mutations
    const { data: statusData, refetch: refetchStatus } = useQuery(VehicleMngGenerationStatus, {
        pollInterval: CONFIG.STATUS_POLL_INTERVAL,
        fetchPolicy: 'network-only'
    });

    const [startGeneration] = useMutation(VehicleMngStartGeneration);
    const [stopGeneration] = useMutation(VehicleMngStopGeneration);

    // GraphQL subscription for real-time vehicle updates
    const { data: subscriptionData } = useSubscription(VehicleGeneratedSubscription);

    // Safely extract generation status
    const isGenerating = statusData && statusData.VehicleMngGenerationStatus && statusData.VehicleMngGenerationStatus.isGenerating || false;

    // Handle subscription data
    useEffect(() => {
        console.log('Subscription data received:', subscriptionData);
        if (subscriptionData && subscriptionData.VehicleMngVehicleGenerated) {
            console.log('Vehicle generated event:', subscriptionData.VehicleMngVehicleGenerated);
            const vehicleData = subscriptionData.VehicleMngVehicleGenerated;
            
            setVehicles(prevVehicles => {
                const newVehicles = [...prevVehicles, vehicleData];
                console.log('newVehicles', newVehicles);
                
                // Keep only last N vehicles for performance
                return newVehicles.slice(-CONFIG.MAX_VEHICLES_IN_MEMORY);
            });
            setTotalVehicles(prev => prev + 1);
        }
    }, [subscriptionData]);

    // Update display vehicles only every 1 second to optimize re-renders
    useEffect(() => {
        const now = Date.now();
        if (now - lastRenderTime.current >= CONFIG.UI_UPDATE_INTERVAL) {
            console.log('⏰ Actualizando UI - Han pasado más de 1 segundo:', {
                vehiclesInMemory: vehicles.length,
                lastUpdate: formatTimestamp(lastRenderTime.current),
                currentTime: formatTimestamp(now)
            });
            setDisplayVehicles(vehicles);
            lastRenderTime.current = now;
        } else {
            // Schedule update for when 1 second has passed
            const timeSinceLastRender = now - lastRenderTime.current;
            const timeUntilNextRender = CONFIG.UI_UPDATE_INTERVAL - timeSinceLastRender;
            
            console.log('⏳ Debounce activo - Esperando para actualizar UI:', {
                vehiclesInMemory: vehicles.length,
                timeSinceLastRender: `${timeSinceLastRender}ms`,
                timeUntilNextRender: `${timeUntilNextRender}ms`
            });
            
            const timeoutId = setTimeout(() => {
                console.log('⏰ Actualización programada ejecutada:', {
                    vehiclesInMemory: vehicles.length,
                    timestamp: formatTimestamp(Date.now())
                });
                setDisplayVehicles(vehicles);
                lastRenderTime.current = Date.now();
            }, timeUntilNextRender);
            
            return () => clearTimeout(timeoutId);
        }
    }, [vehicles]);

    const handleStartGeneration = useCallback(async () => {
        try {
            await startGeneration();
            refetchStatus();
        } catch (error) {
            console.error('Error starting generation:', error);
        }
    }, [startGeneration, refetchStatus]);

    const handleStopGeneration = useCallback(async () => {
        try {
            await stopGeneration();
            refetchStatus();
        } catch (error) {
            console.error('Error stopping generation:', error);
        }
    }, [stopGeneration, refetchStatus]);

    if (!user.selectedOrganization) {
        return <FuseLoading />;
    }

    return (
        <Box>
            <VehiclesHeader 
                isGenerating={isGenerating}
                totalVehicles={totalVehicles}
                onStartGeneration={handleStartGeneration}
                onStopGeneration={handleStopGeneration}
            />
            <VehiclesTable 
                vehicles={displayVehicles}
                totalVehicles={totalVehicles}
            />
        </Box>
    );
}

export default withReducer('VehicleManagement', reducer)(Vehicles);
