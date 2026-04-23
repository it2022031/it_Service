import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
    GrpcError,
    ParsedRouterRequest,
    status,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { ConduitString, RoutingManager } from '@conduitplatform/module-tools';
import { User } from '@it-service/common-types/lib/User.js';
import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

import { EquipmentHandlers , RoleHandlers } from '../handlers/index.js';

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

    private async inAppAdminMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(status.UNAUTHENTICATED, 'Authentication required');
        }

        if (user.role !== UserRole.ADMIN) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires admin role',
            );
        }

        return {};
    }
    private async EmployeeMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(status.UNAUTHENTICATED, 'Authentication required');
        }

        if (user.role !== UserRole.EMPLOYEE) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires employee role',
            );
        }

        return {};
    }
    private async ItStaffMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(status.UNAUTHENTICATED, 'Authentication required');
        }

        if (user.role !== UserRole.IT_STAFF) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires it staff role',
            );
        }

        return {};
    }
    private async AdminOrEmployeeMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(status.UNAUTHENTICATED, 'Authentication required');
        }

        if (
            user.role !== UserRole.ADMIN &&
            user.role !== UserRole.EMPLOYEE
        ) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires admin or employee role',
            );
        }

        return {};
    }

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'inAppAdminMiddleware' },
            this.inAppAdminMiddleware.bind(this),
        );
        this.routingManager.middleware(
            { path: '/', name: 'AdminOrEmployeeMiddleware' },
            this.AdminOrEmployeeMiddleware.bind(this),
        );
        this.routingManager.route(
            {
                path: '/example/status',
                action: ConduitRouteActions.GET,
                description:
                    'Example authenticated route (admin only) — demo for interns',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ExampleStatusResponse', 'example'),
            this.equipmentHandlers.getExampleStatus.bind(this.equipmentHandlers),
        );
        this.routingManager.route(
            {
                path: '/equipment/create',
                action: ConduitRouteActions.POST,
                description: 'Creates a new equipment',
                bodyParams: {
                    name: ConduitString.Required,
                    //@ts-ignore
                    description: ConduitString.Optional,
                    availability: ConduitString.Required,
                    status: ConduitString.Optional,
                },
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('CreateEquipmentResponse', 'example'),
            this.equipmentHandlers.createEquipment.bind(this.equipmentHandlers),
        );
        this.routingManager.route(
            {
                path: '/user/role',
                action: ConduitRouteActions.GET,
                description: 'Returns current user role',
                middlewares: ['authMiddleware'],
            },
            new ConduitRouteReturnDefinition('GetUserRoleResponse', 'example'),
            this.roleHandlers.getMyRole.bind(this.roleHandlers),
        );
        this.routingManager.route(
            {
                path: '/equipment',
                action: ConduitRouteActions.GET,
                description: 'List equipment with optional filters and pagination',
                queryParams: {
                    status: ConduitString.Optional,
                    availability: ConduitString.Optional,
                    skip: ConduitString.Optional,
                    limit: ConduitString.Optional,
                },
                middlewares: ['authMiddleware', 'AdminOrEmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('ListEquipmentResponse'),
            this.equipmentHandlers.listEquipment.bind(this.equipmentHandlers),
        );
        this.routingManager.route(
            {
                path: '/equipment/:id/mark-returned',
                action: ConduitRouteActions.PATCH,
                description: 'Marks equipment as returned',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('MarkReturnedResponse'),
            this.equipmentHandlers.markReturnedEquipment.bind(this.equipmentHandlers),
        );
        this.routingManager.route(
            {
                path: '/equipment/:id',
                action: ConduitRouteActions.DELETE,
                description: 'Deletes an equipment',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('DeleteEquipmentResponse'),
            this.equipmentHandlers.deleteEquipment.bind(this.equipmentHandlers),
        );
    }
}


