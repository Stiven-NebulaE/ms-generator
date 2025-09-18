import React, { useMemo, memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography, Box } from '@material-ui/core';

// Constants for better maintainability
const TABLE_CONFIG = {
    HEIGHT: 400,
    ITEM_SIZE: 48,
    OVERSCAN_COUNT: 5,
};

const COLUMN_CONFIG = {
    WIDTH: '20%',
    PADDING: '0 16px'
};

const getVehicleProperty = (vehicle, property) => {
    return vehicle.data ? vehicle.data[property] : vehicle[property];
};

const VehiclesTable = memo(function VehiclesTable({ vehicles, totalVehicles }) {
    // Memoize the vehicle data to prevent unnecessary re-renders
    const vehicleData = useMemo(() => {
        console.log('📊 VehiclesTable - Datos actualizados:', {
            totalVehicles: vehicles.length,
            sampleData: vehicles.slice(0, 3),
            timestamp: new Date().toISOString()
        });
        return vehicles;
    }, [vehicles]);

    // Virtualized row component - memoized for performance
    const VehicleRow = memo(({ index, style }) => {
        const vehicle = vehicleData[index];
        if (!vehicle) return null;

        console.log(`🔄 VehicleRow renderizada - Index: ${index}, Total items: ${vehicleData.length}`);

        // Extract vehicle properties using utility function
        const vehicleProperties = {
            year: getVehicleProperty(vehicle, 'year'),
            type: getVehicleProperty(vehicle, 'type'),
            hp: getVehicleProperty(vehicle, 'hp'),
            topSpeed: getVehicleProperty(vehicle, 'topSpeed'),
            powerSource: getVehicleProperty(vehicle, 'powerSource')
        };

        return (
            <div style={style}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    height: `${TABLE_CONFIG.ITEM_SIZE}px`, 
                    borderBottom: '1px solid #e0e0e0' 
                }}>
                    {Object.values(vehicleProperties).map((value, propIndex) => (
                        <div 
                            key={propIndex}
                            style={{ 
                                width: COLUMN_CONFIG.WIDTH, 
                                padding: COLUMN_CONFIG.PADDING, 
                                textAlign: 'left' 
                            }}
                        >
                            {value}
                        </div>
                    ))}
                </div>
            </div>
        );
    });

    // Virtualization callback - extracted for better readability
    const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex, overscanStartIndex, overscanStopIndex }) => {
        const visibleItems = visibleStopIndex - visibleStartIndex + 1;
        const efficiency = vehicleData.length > 0 ? Math.round((visibleItems / vehicleData.length) * 100) : 0;
        
        console.log('🎯 Virtualización activa:', {
            visibleStartIndex,
            visibleStopIndex,
            overscanStartIndex,
            overscanStopIndex,
            totalItems: vehicleData.length,
            visibleItems,
            efficiency: `${efficiency}%`
        });
    }, [vehicleData.length]);

    return (
        <Paper elevation={1}>
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Vehículos Generados en Tiempo Real
                </Typography>
            </Box>
            
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell style={{ width: COLUMN_CONFIG.WIDTH }}>Año</TableCell>
                        <TableCell style={{ width: COLUMN_CONFIG.WIDTH }}>Tipo</TableCell>
                        <TableCell style={{ width: COLUMN_CONFIG.WIDTH }}>Potencia (HP)</TableCell>
                        <TableCell style={{ width: COLUMN_CONFIG.WIDTH }}>Vel. Máxima (km/h)</TableCell>
                        <TableCell style={{ width: COLUMN_CONFIG.WIDTH }}>Power Source</TableCell>
                    </TableRow>
                </TableHead>
            </Table>
            
            <div style={{ height: `${TABLE_CONFIG.HEIGHT}px`, width: '100%' }}>
                <List
                    height={TABLE_CONFIG.HEIGHT}
                    itemCount={vehicleData.length}
                    itemSize={TABLE_CONFIG.ITEM_SIZE}
                    overscanCount={TABLE_CONFIG.OVERSCAN_COUNT}
                    onItemsRendered={handleItemsRendered}
                >
                    {VehicleRow}
                </List>
            </div>
        </Paper>
    );
});

export default VehiclesTable;
