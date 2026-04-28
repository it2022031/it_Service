import {
    ConduitGrpcSdk,
    ConduitRouteActions,
    ConduitRouteReturnDefinition,
} from '@conduitplatform/grpc-sdk';
import { ConduitObjectId, ConduitString, RoutingManager } from '@conduitplatform/module-tools';

import { TicketHandlers } from '../handlers/index.js';
import {
    employeeMiddleware,
    itStaffMiddleware,
} from '../middlewares/AuthMiddlewares.js';

export class TicketRouter {
    private readonly ticketHandlers: TicketHandlers;

    constructor(
        grpcSdk: ConduitGrpcSdk,
        private readonly routingManager: RoutingManager,
    ) {
        this.ticketHandlers = new TicketHandlers(grpcSdk);
        this.registerRoutes();
    }

    private registerRoutes() {
        this.routingManager.middleware(
            { path: '/', name: 'EmployeeMiddleware' },
            employeeMiddleware,
        );

        this.routingManager.middleware(
            { path: '/', name: 'ItStaffMiddleware' },
            itStaffMiddleware,
        );

        this.routingManager.route(
            {
                path: '/tickets/create',
                action: ConduitRouteActions.POST,
                description: 'Creates a ticket for the current employee',
                bodyParams: {
                    title: ConduitString.Required,
                    //@ts-ignore
                    description: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'EmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('CreateTicketResponse'),
            this.ticketHandlers.createHisOwnTicket.bind(this.ticketHandlers),
        );

        this.routingManager.route(
            {
                path: '/tickets/my',
                action: ConduitRouteActions.GET,
                description: 'Returns current employee tickets',
                middlewares: ['authMiddleware', 'EmployeeMiddleware'],
            },
            new ConduitRouteReturnDefinition('ViewOwnTicketsResponse'),
            this.ticketHandlers.viewHisOwnTickets.bind(this.ticketHandlers),
        );

        this.routingManager.route(
            {
                path: '/tickets/assigned',
                action: ConduitRouteActions.GET,
                description: 'Returns tickets assigned to IT staff',
                middlewares: ['authMiddleware', 'ItStaffMiddleware'],
            },
            new ConduitRouteReturnDefinition('ViewAssignedTicketsResponse'),
            this.ticketHandlers.viewAssignedTickets.bind(this.ticketHandlers),
        );
        this.routingManager.route(
            {
                path: '/tickets/:id/status',
                action: ConduitRouteActions.PATCH,
                description: 'Updates ticket status (IT staff only)',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    status: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'ItStaffMiddleware'],
            },
            new ConduitRouteReturnDefinition('UpdateTicketStatusResponse'),
            this.ticketHandlers.updateTicketStatus.bind(this.ticketHandlers),
        );
        this.routingManager.route(
            {
                path: '/tickets/:id/assign',
                action: ConduitRouteActions.PATCH,
                description: 'Assign ticket to user (admin only)',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    assignedTo: ConduitObjectId.Required,
                },
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('AssignTicketResponse'),
            this.ticketHandlers.assignTicket.bind(this.ticketHandlers),
        );
        this.routingManager.route(
            {
                path: '/tickets/:id/status',
                action: ConduitRouteActions.PATCH,
                description: 'Updates ticket status (IT staff only)',
                urlParams: {
                    id: ConduitObjectId.Required,
                },
                bodyParams: {
                    status: ConduitString.Required,
                },
                middlewares: ['authMiddleware', 'ItStaffMiddleware'],
            },
            new ConduitRouteReturnDefinition('UpdateTicketStatusResponse'),
            this.ticketHandlers.updateTicketStatus.bind(this.ticketHandlers),
        );
        this.routingManager.route(
            {
                path: '/tickets',
                action: ConduitRouteActions.GET,
                description: 'Returns all tickets',
                middlewares: ['authMiddleware', 'inAppAdminMiddleware'],
            },
            new ConduitRouteReturnDefinition('ViewAllTicketsResponse'),
            this.ticketHandlers.viewAllTickets.bind(this.ticketHandlers),
        );
    }
}