import {
    ConduitGrpcSdk,
    GrpcError,
    ParsedRouterRequest,
    UnparsedRouterResponse,
    status as GrpcStatus,
} from '@conduitplatform/grpc-sdk';
import { User } from '@it-service/common-types/lib/User.js';

import type { TicketRecord } from '../types/Ticket.js';
import { TicketStatus } from '@it-service/common-types/lib/enums/TicketStatus.js';
import { TeamName } from '@it-service/common-types/lib/enums/TeamName.js';
import { getTeamByName } from '../utils/Teams.js';
import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

export class TicketHandlers {
    constructor(private readonly grpcSdk: ConduitGrpcSdk) {}

    async createHisOwnTicket(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { title, description } = call.request.bodyParams as {
            title: string;
            description: string;
        };

        const adminTeam = await getTeamByName(this.grpcSdk, TeamName.ADMINS);

        const ticketData = {
            title,
            description,
            createdBy: user._id,
            status: TicketStatus.PENDING,
        };

        const ticket = await this.grpcSdk.database!.create<TicketRecord>(
            'Ticket',
            ticketData,
            user._id,
        );

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${adminTeam._id}`,
            relation: 'owner',
            resource: `Ticket:${ticket._id}`,
        });

        return {
            message: 'Ticket created successfully.',
            ticket,
        };
    }
    async viewHisOwnTickets(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const tickets = await this.grpcSdk.database!.findMany<TicketRecord>(
            'Ticket',
            {
                createdBy: user._id,
            },
            {
                userId: user._id,
            },
        );

        return {
            message: 'User tickets fetched successfully.',
            count: tickets?.length ?? 0,
            tickets,
        };
    }
    async viewAssignedTickets(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const tickets = await this.grpcSdk.database!.findMany<TicketRecord>(
            'Ticket',
            {
                assignedTo: user._id,
            },
            {
                userId: user._id,
            },
        );

        return {
            message: 'Assigned tickets fetched successfully.',
            count: tickets?.length ?? 0,
            tickets,
        };
    }
    async updateTicketStatus(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { id } = call.request.urlParams as {
            id: string;
        };

        const { status } = call.request.bodyParams as {
            status: string;
        };

        if (!Object.values(TicketStatus).includes(status as TicketStatus)) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                `Status must be one of: ${Object.values(TicketStatus).join(', ')}`,
            );
        }

        const result = await this.grpcSdk.database!.updateOne<TicketRecord>(
            'Ticket',
            {
                _id: id,
                assignedTo: user._id,
            },
            {
                status: status as TicketStatus,
            },
            undefined,
            user._id,
        );

        if (!result || result.modifiedCount === 0) {
            throw new GrpcError(
                GrpcStatus.NOT_FOUND,
                'Ticket not found or not assigned to you',
            );
        }

        return {
            message: 'Ticket status updated successfully.',
        };
    }
    async assignTicket(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { id } = call.request.urlParams as {
            id: string;
        };

        const { assignedTo } = call.request.bodyParams as {
            assignedTo: string;
        };

        const assignedUser = await this.grpcSdk.database!.findOne<User>(
            'User',
            {
                _id: assignedTo,
                role: UserRole.IT_STAFF,
            },
        );

        if (!assignedUser) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Assigned user must be IT staff',
            );
        }

        const result = await this.grpcSdk.database!.updateOne<TicketRecord>(
            'Ticket',
            {
                _id: id,
            },
            {
                assignedTo,
            },
            undefined,
            user._id,
        );

        if (!result || result.modifiedCount === 0) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Ticket not found');
        }

        await this.grpcSdk.authorization!.createRelation({
            subject: `User:${assignedTo}`,
            relation: 'owner',
            resource: `Ticket:${id}`,
        });

        return {
            message: 'Ticket assigned successfully.',
        };
    }
    async viewAllTickets(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const tickets = await this.grpcSdk.database!.findMany<TicketRecord>(
            'Ticket',
            {},
            {
                userId: user._id,
            },
        );

        return {
            message: 'All tickets fetched successfully.',
            count: tickets?.length ?? 0,
            tickets,
        };
    }
}
