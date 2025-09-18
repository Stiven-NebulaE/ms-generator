'use strict'

const { of } = require("rxjs");
const { tap } = require('rxjs/operators');
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
/**
 * Singleton instance
 * @type { VehicleES }
 */
let instance;

class VehicleES {

    constructor() {
    }

    /**     
     * Generates and returns an object that defines the Event-Sourcing events handlers.
     * 
     * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
     * 
     * ## Example
     *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
     */
    generateEventProcessorMap() {
        return {
            'Vehicle': {
                "VehicleGenerated": { fn: instance.handleVehicleGenerated$, instance, processOnlyOnSync: false },
            }
        }
    };

    /**
     * Handle VehicleGenerated events
     * @param {*} VehicleGeneratedEvent Vehicle Generated Event
     */
    handleVehicleGenerated$({ etv, aid, av, data, user, timestamp }) {
        ConsoleLogger.i(`VehicleES.handleVehicleGenerated: aid=${aid}, timestamp=${timestamp}, data=${JSON.stringify(data)}`);
        
        // For this PoC, we don't need to store individual vehicles
        // The ms-reporter will handle the aggregation
        return of({ success: true }).pipe(
            tap(() => ConsoleLogger.i(`VehicleES.handleVehicleGenerated: Processed vehicle ${aid}`))
        );
    }
}


/**
 * @returns {VehicleES}
 */
module.exports = () => {
    if (!instance) {
        instance = new VehicleES();
        ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};