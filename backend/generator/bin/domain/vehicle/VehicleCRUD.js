"use strict";

const crypto = require("crypto");
const { of, forkJoin, from, iif, throwError, Subject, interval, EMPTY } = require("rxjs");
const { mergeMap, catchError, map, toArray, pluck, takeUntil, tap, filter } = require('rxjs/operators');

const Event = require("@nebulae/event-store").Event;
const { CqrsResponseHelper } = require('@nebulae/backend-node-tools').cqrs;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
const { CustomError, INTERNAL_SERVER_ERROR_CODE, PERMISSION_DENIED } = require("@nebulae/backend-node-tools").error;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const READ_ROLES = ["VEHICLE_READ"];
const WRITE_ROLES = ["VEHICLE_WRITE"];
const REQUIRED_ATTRIBUTES = [];
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";
const VEHICLE_GENERATED_TOPIC = "fleet/vehicles/generated";
const WEBSOCKET_TOPIC = "emi-gateway-websocket-updates";

const broker = brokerFactory();
const eventSourcing = require("../../tools/event-sourcing").eventSourcing;
const VehicleDA = require("./data-access/VehicleDA");
const MqttBroker = require("@nebulae/backend-node-tools").broker.MqttBroker;

// Create MQTT broker for materialized view updates
const mqttBroker = new MqttBroker({
  gatewayRepliesTopic: "emi-gateway-replies-topic-mbe-generator",
  gatewayEventsTopic: "Events",
  materializedViewTopic: MATERIALIZED_VIEW_TOPIC,
  projectId: process.env.GCLOUD_PROJECT_ID,
  mqttServerUrl: process.env.MQTT_SERVER_URL,
  replyTimeout: process.env.REPLY_TIMEOUT || 2000
});

/**
 * Singleton instance
 * @type { VehicleCRUD }
 */
let instance;

class VehicleCRUD {
  constructor() {
    this.generationSubject = new Subject();
    this.stopGenerationSubject = new Subject();
    this.isGenerating = false;
    this.mqttBroker = new MqttBroker({
      mqttServerUrl: process.env.MQTT_SERVER_URL || 'mqtt://localhost:1883',
      replyTimeout: 2000
    });
  }

  /**     
   * Generates and returns an object that defines the CQRS request handlers.
   * 
   * The map is a relationship of: AGGREGATE_TYPE VS { MESSAGE_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   * 
   * ## Example
   *  { "CreateUser" : { "somegateway.someprotocol.mutation.CreateUser" : {fn: createUser$, instance: classInstance } } }
   */
  generateRequestProcessorMap() {
    return {
      'Vehicle': {
        "emigateway.graphql.mutation.VehicleMngStartGeneration": { fn: instance.startGeneration$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.VehicleMngStopGeneration": { fn: instance.stopGeneration$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.query.VehicleMngGenerationStatus": { fn: instance.getGenerationStatus$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
      }
    }
  };


  /**
   * Starts vehicle generation
   */
  startGeneration$({ root, args, jwt }, authToken) {
    if (this.isGenerating) {
      return of({ code: 400, message: "Generation is already running" }).pipe(
        mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response))
      );
    }

    this.isGenerating = true;
    this.stopGenerationSubject = new Subject();

    // Start the generation interval
    const generation$ = interval(50).pipe(
      takeUntil(this.stopGenerationSubject),
      mergeMap(() => {
        const vehicle = this.generateRandomVehicle();
        const event = this.createVehicleGeneratedEvent(vehicle);
        
        // Publish to MQTT
        ConsoleLogger.i(`Creating event with: at=${event.at}, et=${event.et}, aid=${event.aid}`);
        
        const mqttTopic = 'fleet/vehicles/generated';
        ConsoleLogger.i(`Publishing vehicle event to MQTT topic: ${mqttTopic}`);
        
        // Use mergeMap to ensure proper sequencing and avoid duplicate sends
        return this.mqttBroker.send$(mqttTopic, 'vehicle.generated', event).pipe(
          tap(() => {
            ConsoleLogger.i(`Vehicle event published to MQTT successfully: ${JSON.stringify(event)}`);
          }),
          mergeMap(() => {
            // Send to WebSocket for UI updates
            return broker.send$(WEBSOCKET_TOPIC, {
              type: 'VEHICLE_GENERATED',
              data: vehicle,
              timestamp: new Date().toISOString()
            });
          }),
          mergeMap(() => {
            // Send to materialized view updates for GraphQL subscriptions
            return mqttBroker.send$(MATERIALIZED_VIEW_TOPIC, 'VEHICLE_GENERATED', {
              type: 'VEHICLE_GENERATED',
              data: {
                timestamp: new Date().toISOString(),
                data: vehicle
              }
            });
          }),
          tap(() => {
            ConsoleLogger.i(`Materialized view event sent successfully`);
            ConsoleLogger.i(`Vehicle generated: ${JSON.stringify(vehicle)}`);
          }),
          catchError(error => {
            ConsoleLogger.e(`Error in vehicle generation pipeline: ${error.message}`);
            return of(null); // Continue processing even if one step fails
          })
        );
      })
    );

    // Start the generation process
    generation$.subscribe({
      complete: () => {
        this.isGenerating = false;
        ConsoleLogger.i("Vehicle generation stopped");
      }
    });

    return of({ code: 200, message: "Vehicle generation started" }).pipe(
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response))
    );
  }

  /**
   * Stops vehicle generation
   */
  stopGeneration$({ root, args, jwt }, authToken) {
    if (!this.isGenerating) {
      return of({ code: 400, message: "Generation is not running" }).pipe(
        mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response))
      );
    }

    this.stopGenerationSubject.next();
    this.stopGenerationSubject.complete();

    return of({ code: 200, message: "Vehicle generation stopped" }).pipe(
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response))
    );
  }

  /**
   * Gets generation status
   */
  getGenerationStatus$({ root, args, jwt }, authToken) {
    console.log(`Hace get status <========`);
    return of({ 
      isGenerating: this.isGenerating,
      status: this.isGenerating ? "running" : "stopped"
    }).pipe(
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response))
    );
  }

  /**
   * Generates a random vehicle
   */
  generateRandomVehicle() {
    const types = ['SUV', 'PickUp', 'Sedan', 'Hatchback', 'Coupe'];
    const powerSources = ['Electric', 'Gas', 'Hybrid', 'Diesel'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const powerSource = powerSources[Math.floor(Math.random() * powerSources.length)];
    const hp = Math.floor(Math.random() * 225) + 75; // 75-300 HP
    const year = Math.floor(Math.random() * 45) + 1980; // 1980-2024
    const topSpeed = Math.floor(Math.random() * 200) + 100; // 100-300 km/h

    return {
      type,
      powerSource,
      hp,
      year,
      topSpeed
    };
  }

  /**
   * Creates a VehicleGenerated event with proper structure
   */
  createVehicleGeneratedEvent(vehicleData) {
    const dataString = JSON.stringify(vehicleData);
    const aid = crypto.createHash('sha256').update(dataString).digest('hex');
    
    return {
      at: "Vehicle",
      et: "Generated",
      aid: aid,
      timestamp: new Date().toISOString(),
      data: vehicleData
    };
  }
}

/**
 * @returns {VehicleCRUD}
 */
module.exports = () => {
  if (!instance) {
    instance = new VehicleCRUD();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
