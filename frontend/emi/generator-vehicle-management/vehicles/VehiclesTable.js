import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography, Box } from '@material-ui/core';

function VehiclesTable({ vehicles, totalVehicles }) {
    // Memoize the vehicle data to prevent unnecessary re-renders
    const vehicleData = useMemo(() => {
        console.log('VehiclesTable - vehicles received:', vehicles);
        return vehicles;
    }, [vehicles]);

    // Virtualized row component
    const VehicleRow = ({ index, style }) => {
        const vehicle = vehicleData[index];
        if (!vehicle) return null;

        return (
            <div style={style}>
                <div style={{ display: 'flex', alignItems: 'center', height: '48px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ width: '20%', padding: '0 16px', textAlign: 'left' }}>
                        {vehicle.data ? vehicle.data.year : vehicle.year}
                    </div>
                    <div style={{ width: '20%', padding: '0 16px', textAlign: 'left' }}>
                        {vehicle.data ? vehicle.data.type : vehicle.type}
                    </div>
                    <div style={{ width: '20%', padding: '0 16px', textAlign: 'left' }}>
                        {vehicle.data ? vehicle.data.hp : vehicle.hp}
                    </div>
                    <div style={{ width: '20%', padding: '0 16px', textAlign: 'left' }}>
                        {vehicle.data ? vehicle.data.topSpeed : vehicle.topSpeed}
                    </div>
                    <div style={{ width: '20%', padding: '0 16px', textAlign: 'left' }}>
                        {vehicle.data ? vehicle.data.powerSource : vehicle.powerSource}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Paper elevation={1}>
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Vehículos Generados en Tiempo Real
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Total: {totalVehicles.toLocaleString()} vehículos
                </Typography>
            </Box>
            
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell style={{ width: '20%' }}>Año</TableCell>
                        <TableCell style={{ width: '20%' }}>Tipo</TableCell>
                        <TableCell style={{ width: '20%' }}>Potencia (HP)</TableCell>
                        <TableCell style={{ width: '20%' }}>Vel. Máxima (km/h)</TableCell>
                        <TableCell style={{ width: '20%' }}>Power Source</TableCell>
                    </TableRow>
                </TableHead>
            </Table>
            
            <div style={{ height: '400px', width: '100%' }}>
                <List
                    height={400}
                    itemCount={vehicleData.length}
                    itemSize={48}
                    overscanCount={5}
                >
                    {VehicleRow}
                </List>
            </div>
        </Paper>
    );
}

export default VehiclesTable;
