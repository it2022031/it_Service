import { ConduitGrpcSdk, HealthCheckStatus } from '@conduitplatform/grpc-sdk';
import { ManagedModule, RoutingManager } from '@conduitplatform/module-tools';

import { BasicRouter, LendingRouter, TicketRouter } from './routers/index.js';
import { resources } from './resources/index.js';

export default class MainService extends ManagedModule<void> {
    protected configSchema?: object;
    protected metricsSchema?: object;
    private routingManager!: RoutingManager;
    private basicRouter!: BasicRouter;
    private lendingRouter!: LendingRouter;
    private ticketRouter!: TicketRouter;

    constructor() {
        super('main-service');
        this.updateHealth(HealthCheckStatus.UNKNOWN, true);
    }

    async onServerStart() {
        ConduitGrpcSdk.Logger.log('Waiting for database...');
        await this.grpcSdk.waitForExistence('database');
        ConduitGrpcSdk.Logger.log('Waiting for authentication...');
        await this.grpcSdk.waitForExistence('authentication');
        ConduitGrpcSdk.Logger.log('Waiting for authorization...');
        await this.grpcSdk.waitForExistence('authorization');
        ConduitGrpcSdk.Logger.log('All modules up & running!');
        await this.setUpAuthz();
        this.updateHealth(HealthCheckStatus.SERVING);
    }

    async onRegister() {
        this.grpcSdk.monitorModule('router', async (serving) => {
            if (!serving) return;
            this.routingManager = new RoutingManager(
                this.grpcSdk.router!,
                this.grpcServer,
            );
            this.routingManager.clear();
            this.basicRouter = new BasicRouter(
                this.grpcSdk,
                this.routingManager,
            );
            this.lendingRouter = new LendingRouter(
                this.grpcSdk,
                this.routingManager,
            );
            this.ticketRouter = new TicketRouter(
                this.grpcSdk,
                this.routingManager,
            );

            await this.routingManager.registerRoutes();
        });
    }

    private async setUpAuthz() {
        for (const r of resources) {
            await this.grpcSdk.authorization!.defineResource(r);
        }
    }
}
