import {
    ConduitGrpcSdk,
    GrpcError,
    ParsedRouterRequest,
    status as GrpcStatus,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { User } from '@it-service/common-types/lib/User.js';

/**
 * Example handler class: inject `grpcSdk`, read route context, use the database API.
 */
export class EquipmentHandlers {
    constructor(private readonly grpcSdk: ConduitGrpcSdk) {}

    /**
     * Demo handler: returns the authenticated user id and whether an "Admins" team exists.
     */
    async getExampleStatus(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const adminTeam = await this.grpcSdk.database!.findOne(
            'Team',
            { name: 'Admins' },
        );

        return {
            example: {
                userId: user._id,
                message: 'Example route is working.',
                adminTeamExists: !!adminTeam,
            },
        };
    }

    async createEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const {
            name,
            description,
            availability,
            status,
        } = call.request.bodyParams as {
            name?: string;
            description?: string;
            availability?: string;
            status?: string;
        };

        if (!name || typeof name !== 'string') {
            throw new GrpcError(GrpcStatus.INVALID_ARGUMENT, 'Name is required');
        }

        if (!availability || typeof availability !== 'string') {
            throw new GrpcError(GrpcStatus.INVALID_ARGUMENT, 'Availability is required');
        }

        if (!['active', 'retired'].includes(availability)) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Availability must be active or retired',
            );
        }

        if (status !== undefined && !['available', 'unavailable'].includes(status)) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Status must be available or unavailable',
            );
        }

        if (description !== undefined && typeof description !== 'string') {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Description must be a string',
            );
        }

        const equipmentData = {
            name,
            description,
            availability,
            status: status ?? 'unavailable',
        };

        const equipment = await this.grpcSdk.database!.create(
            'Equipment',
            equipmentData,
        );

        return {
            example: {
                userId: user._id,
                message: 'Equipment is created.',
                equipment,
            },
        };
    }
}
