import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
    GrpcError,
    ParsedRouterRequest,
    status,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { ConduitObjectId, ConduitString, RoutingManager } from '@conduitplatform/module-tools';
import { User } from '@it-service/common-types/lib/User.js';
import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

import { LendingHandlers } from '../handlers/index.js';

export class LendingRouter {
    private readonly lendingHandlers: LendingHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.lendingHandlers = new LendingHandlers(grpcSdk);
        this.registerRoutes();
    }

    private async EmployeeMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(
                status.UNAUTHENTICATED,
                'Authentication required',
            );
        }

        if (user.role !== UserRole.EMPLOYEE) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires employee role',
            );
        }

        return {};
    }
    private async ItStaffOrAdminMiddleware(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(
                status.UNAUTHENTICATED,
                'Authentication required',
            );
        }

        if (
            user.role !== UserRole.ADMIN &&
            user.role !== UserRole.IT_STAFF
        ) {
            throw new GrpcError(
                status.PERMISSION_DENIED,
                'Endpoint requires admin or it staff role',
            );
        }

        return {};
    }

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'EmployeeMiddleware' },
            this.EmployeeMiddleware.bind(this),
        );
        this.routingManager.middleware(
            { path: '/', name: 'ItStaffOrAdminMiddleware' },
            this.ItStaffOrAdminMiddleware.bind(this),
        );

        this.routingManager.route(
            {
                path: '/lendings/create',
                action: ConduitRouteActions.POST,
                description: 'Creates a new lending request',
                bodyParams: {
                    equipment: ConduitObjectId.Required,
                },
                middlewares: ['authMiddleware', 'EmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('CreateLendingResponse'),
            this.lendingHandlers.createLending.bind(this.lendingHandlers),
        );
        this.routingManager.route(
            {
                path: '/lendings/my',
                action: ConduitRouteActions.GET,
                description: 'Returns current employee lending requests',
                middlewares: ['authMiddleware', 'EmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('ViewOwnLendingRequestsResponse'),
            this.lendingHandlers.viewOwnRequests.bind(this.lendingHandlers),
        );
        this.routingManager.route(
            {
                path: '/lendings',
                action: ConduitRouteActions.GET,
                description: 'Returns all lending requests (admin & it staff)',
                middlewares: ['authMiddleware', 'ItStaffOrAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ViewAllLendingsResponse'),
            this.lendingHandlers.viewAllRequests.bind(this.lendingHandlers),
        );
        this.routingManager.route(
            {
                path: '/lendings/:id/review',
                action: ConduitRouteActions.PATCH,
                description: 'Approve or reject lending request',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    requestStatus: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'ItStaffOrAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ReviewLendingRequestResponse'),
            this.lendingHandlers.reviewRequest.bind(this.lendingHandlers),
        );
    }

}