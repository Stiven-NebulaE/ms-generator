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
                            className="text-white ml-1"
                        />
                        <Typography variant="body1" className="ml-2">
                            | Vehículos Generados: {totalVehicles.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
                <Box gap={2} className="grid md:flex">
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PlayArrow />}
                        onClick={onStartGeneration}
                        disabled={isGenerating}
                        className="md:mr-3 mb-3 md:mb-0"
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
