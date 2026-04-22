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

import { EquipmentHandlers } from '../handlers/index.js';

export class BasicRouter {
    private readonly equipmentHandlers: EquipmentHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.equipmentHandlers = new EquipmentHandlers(grpcSdk);
        this.registerRoutes();
    }

    private async AdminMiddleware(
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

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'AdminMiddleware' },
            this.AdminMiddleware.bind(this),
        );

        this.routingManager.route(
            {
                path: '/example/status',
                action: ConduitRouteActions.GET,
                description:
                    'Example authenticated route (admin only) — demo for interns',
                middlewares: ['authMiddleware', 'AdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ExampleStatusResponse', 'example'),
            this.equipmentHandlers.getExampleStatus.bind(this.equipmentHandlers),
        );
        // this.routingManager.route(
        //     {
        //         path: '/equipment/create',
        //         action: ConduitRouteActions.POST,
        //         description: 'Creates a new equipment',
        //         middlewares: ['authMiddleware', 'AdminMiddleware'],
        //     },
        //     new ConduitRouteReturnDefinition('CreateEquipmentResponse', 'example'),
        //     this.equipmentHandlers.createEquipment.bind(this.equipmentHandlers),
        // );
        this.routingManager.route(
            {
                path: '/equipment/create',
                action: ConduitRouteActions.POST,
                description: 'Creates a new equipment',
                bodyParams: {
                    name: ConduitString.Required,
                    description: ConduitString.Required,
                    availability: ConduitString.Required,
                    status: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'AdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('CreateEquipmentResponse', 'example'),
            this.equipmentHandlers.createEquipment.bind(this.equipmentHandlers),
        );
    }
}
