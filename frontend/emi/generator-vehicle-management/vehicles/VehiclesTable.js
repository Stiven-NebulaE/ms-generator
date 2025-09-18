import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography, Box } from '@material-ui/core';

function VehiclesTable({ vehicles, totalVehicles }) {
    // Memoize the vehicle data to prevent unnecessary re-renders
    const vehicleData = useMemo(() => vehicles, [vehicles]);

    // Virtualized row component
    const VehicleRow = ({ index, style }) => {
        const vehicle = vehicleData[index];
        if (!vehicle) return null;

        return (
            <div style={style}>
                <TableRow hover>
                    <TableCell>{vehicle.data.year}</TableCell>
                    <TableCell>{vehicle.data.type}</TableCell>
                    <TableCell>{vehicle.data.hp}</TableCell>
                    <TableCell>{vehicle.data.topSpeed}</TableCell>
                    <TableCell>{vehicle.data.powerSource}</TableCell>
                </TableRow>
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
                        <TableCell>Año</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Potencia (HP)</TableCell>
                        <TableCell>Vel. Máxima (km/h)</TableCell>
                        <TableCell>Power Source</TableCell>
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
