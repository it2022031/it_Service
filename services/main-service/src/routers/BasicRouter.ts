import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
    GrpcError,
    ParsedRouterRequest,
    status,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { RoutingManager } from '@conduitplatform/module-tools';
import { User } from '@it-service/common-types/lib/User.js';
import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

import { ExampleHandlers } from '../handlers/exampleHandlers.js';

export class BasicRouter {
    private readonly exampleHandlers: ExampleHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.exampleHandlers = new ExampleHandlers(grpcSdk);
        this.registerRoutes();
    }

    private async exampleAdminMiddleware(
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

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'exampleAdminMiddleware' },
            this.exampleAdminMiddleware.bind(this),
        );

        this.routingManager.route(
            {
                path: '/example/status',
                action: ConduitRouteActions.GET,
                description:
                    'Example authenticated route (admin only) — demo for interns',
                middlewares: ['authMiddleware', 'exampleAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ExampleStatusResponse', 'example'),
            this.exampleHandlers.getExampleStatus.bind(this.exampleHandlers),
        );
    }
}
