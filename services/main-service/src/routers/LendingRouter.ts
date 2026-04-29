import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
} from '@conduitplatform/grpc-sdk';
import {
    ConduitObjectId,
    ConduitString,
    RoutingManager,
} from '@conduitplatform/module-tools';

import { LendingHandlers } from '../handlers/index.js';
import {
    employeeMiddleware,
    itStaffOrAdminMiddleware,
} from '../middlewares/AuthMiddlewares.js';

export class LendingRouter {
    private readonly lendingHandlers: LendingHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.lendingHandlers = new LendingHandlers(grpcSdk);
        this.registerRoutes();
    }

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'EmployeeMiddleware' },
            employeeMiddleware,
        );

        this.routingManager.middleware(
            { path: '/', name: 'ItStaffOrAdminMiddleware' },
            itStaffOrAdminMiddleware,
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
