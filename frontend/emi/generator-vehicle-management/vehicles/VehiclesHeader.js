import React from 'react';
import { Button, Typography, Box, Chip } from '@material-ui/core';
import { PlayArrow, Stop } from '@material-ui/icons';

function VehiclesHeader({ 
    isGenerating, 
    totalVehicles, 
    onStartGeneration, 
    onStopGeneration 
}) {
    return (
        <Box 
            p={3} 
            bgcolor="primary.main" 
            color="primary.contrastText"
            borderRadius={1}
            mb={2}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        GENERADOR DE FLOTA VEHICULAR
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body1">
                            Estado: 
                        </Typography>
                        <Chip 
                            label={isGenerating ? "Corriendo..." : "Detenido"} 
                            color={isGenerating ? "secondary" : "default"}
                            variant="outlined"
                        />
                        <Typography variant="body1">
                            | Vehículos Generados: {totalVehicles.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PlayArrow />}
                        onClick={onStartGeneration}
                        disabled={isGenerating}
                    >
                        Iniciar Simulación
                    </Button>
                    <Button
                        variant="contained"
                        color="default"
                        startIcon={<Stop />}
                        onClick={onStopGeneration}
                        disabled={!isGenerating}
                    >
                        Detener Simulación
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default VehiclesHeader;
