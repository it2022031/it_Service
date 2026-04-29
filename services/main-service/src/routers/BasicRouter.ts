import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
} from '@conduitplatform/grpc-sdk';
import {
    ConduitNumber,
    ConduitObjectId,
    ConduitString,
    RoutingManager,
} from '@conduitplatform/module-tools';

import { EquipmentHandlers, RoleHandlers } from '../handlers/index.js';

export class BasicRouter {
    private readonly equipmentHandlers: EquipmentHandlers;
    private readonly roleHandlers: RoleHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.equipmentHandlers = new EquipmentHandlers(grpcSdk);
        this.roleHandlers = new RoleHandlers(grpcSdk);
        this.registerRoutes();
    }

    private registerRoutes() {
        this.routingManager.route(
            {
                path: '/equipment/create',
                action: ConduitRouteActions.POST,
                description: 'Creates a new equipment',
                bodyParams: {
                    name: ConduitString.Required,
                    //@ts-ignore
                    description: ConduitString.Required,
                    availability: ConduitString.Required,
                    status: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('CreateEquipmentResponse', {
                userId: ConduitObjectId.Required,
                message: ConduitString.Required,
                equipment: 'Equipment',
            }),
            this.equipmentHandlers.createEquipment.bind(this.equipmentHandlers),
        );

        this.routingManager.route(
            {
                path: '/user/role',
                action: ConduitRouteActions.GET,
                description: 'Returns current user role',
                middlewares: ['authMiddleware'],
            },
            new ConduitRouteReturnDefinition('GetUserRoleResponse', {
                userId: ConduitObjectId.Required,
                role: ConduitString.Required,
            }),
            this.roleHandlers.getMyRole.bind(this.roleHandlers),
        );

        this.routingManager.route(
            {
                path: '/equipment',
                action: ConduitRouteActions.GET,
                description:
                    'List equipment with optional filters and pagination',
                queryParams: {
                    status: ConduitString.Optional,
                    availability: ConduitString.Optional,
                    skip: ConduitNumber.Optional,
                    limit: ConduitNumber.Optional,
                },
                middlewares: ['authMiddleware', 'AdminOrEmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('ListEquipmentResponse', {
                message: ConduitString.Required,
                count: ConduitNumber.Required,
                equipment: ['Equipment'],
            }),
            this.equipmentHandlers.listEquipment.bind(this.equipmentHandlers),
        );

        this.routingManager.route(
            {
                path: '/equipment/:id/mark-returned',
                action: ConduitRouteActions.PATCH,
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                description: 'Marks equipment as returned',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('MarkReturnedResponse', {
                message: ConduitString.Required,
                equipment: 'Equipment',
                lending: 'Lending',
            }),
            this.equipmentHandlers.markReturnedEquipment.bind(
                this.equipmentHandlers,
            ),
        );

        this.routingManager.route(
            {
                path: '/equipment/:id',
                action: ConduitRouteActions.DELETE,
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                description: 'Deletes an equipment',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('DeleteEquipmentResponse', {
                message: ConduitString.Required,
                equipmentId: ConduitObjectId.Required,
            }),
            this.equipmentHandlers.deleteEquipment.bind(this.equipmentHandlers),
        );

        this.routingManager.route(
            {
                path: '/equipment/:id',
                action: ConduitRouteActions.PATCH,
                description: 'Updates equipment name or description',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    name: ConduitString.Optional,
                    //@ts-ignore
                    description: ConduitString.Optional,
                },
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('EditEquipmentResponse', {
                message: ConduitString.Required,
                equipment: 'Equipment',
            }),
            this.equipmentHandlers.editEquipment.bind(this.equipmentHandlers),
        );

        this.routingManager.route(
            {
                path: '/equipment/:id/availability',
                action: ConduitRouteActions.PATCH,
                description: 'Marks equipment as active or retired',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    availability: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('UpdateAvailabilityResponse', {
                message: ConduitString.Required,
                equipment: 'Equipment',
                lending: 'Lending',
            }),
            this.equipmentHandlers.updateAvailability.bind(
                this.equipmentHandlers,
            ),
        );
    }
}
