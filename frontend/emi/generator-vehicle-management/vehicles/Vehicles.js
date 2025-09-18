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

function Vehicles() {
    const user = useSelector(({ auth }) => auth.user);
    const [vehicles, setVehicles] = useState([]);
    const [totalVehicles, setTotalVehicles] = useState(0);
    const lastRenderTime = useRef(0);

    // GraphQL queries and mutations
    const { data: statusData, refetch: refetchStatus } = useQuery(VehicleMngGenerationStatus, {
        pollInterval: 1000,
        fetchPolicy: 'network-only'
    });

    const [startGeneration] = useMutation(VehicleMngStartGeneration);
    const [stopGeneration] = useMutation(VehicleMngStopGeneration);

    // GraphQL subscription for real-time vehicle updates
    const { data: subscriptionData } = useSubscription(VehicleGeneratedSubscription);

    const isGenerating = statusData && statusData.VehicleMngGenerationStatus && statusData.VehicleMngGenerationStatus.isGenerating || false;

    // Handle subscription data
    useEffect(() => {
        if (subscriptionData && subscriptionData.VehicleMngVehicleGenerated) {
            const now = Date.now();
            
            // Only update if more than 1 second has passed since last render
            if (now - lastRenderTime.current > 1000) {
                setVehicles(prevVehicles => {
                    const newVehicles = [...prevVehicles, subscriptionData.VehicleMngVehicleGenerated];

                    console.log('newVehicles', newVehicles);
                    
                    // Keep only last 1000 vehicles for performance
                    return newVehicles.slice(-1000);
                });
                setTotalVehicles(prev => prev + 1);
                lastRenderTime.current = now;
            }
        }
    }, [subscriptionData]);

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
                vehicles={vehicles}
                totalVehicles={totalVehicles}
            />
        </Box>
    );
}

export default withReducer('VehicleManagement', reducer)(Vehicles);
