import {
    ConduitGrpcSdk,
    GrpcError,
    ParsedRouterRequest,
    status as GrpcStatus,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { User } from '@it-service/common-types/lib/User.js';
import type {  LendingRecord } from '../types/Lending.js';
import type {  EquipmentRecord  } from '../types/Equipment.js';

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
    async viewAvailableEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(GrpcStatus.UNAUTHENTICATED, 'Authentication required');
        }

        const equipment = await this.grpcSdk.database!.findMany(
            'Equipment',
            {
                status: 'available',
                availability: 'active',
            },
        );

        return {
            example: {
                message: 'Available equipment fetched successfully.',
                count: equipment?.length ?? 0,
                equipment,
            },
        };
    }
    async markReturnedEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { equipmentId } = call.request.bodyParams as {
            equipmentId?: string;
        };

        if (!user) {
            throw new GrpcError(
                GrpcStatus.UNAUTHENTICATED,
                'Authentication required',
            );
        }

        if (!equipmentId || typeof equipmentId !== 'string') {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'equipmentId is required',
            );
        }

        const existingEquipment = (await this.grpcSdk.database!.findOne(
            'Equipment',
            { _id: equipmentId },
        )) as EquipmentRecord | null;


        if (!existingEquipment) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Equipment not found');
        }

        if (existingEquipment.status !== 'unavailable') {
            throw new GrpcError(
                GrpcStatus.FAILED_PRECONDITION,
                'Equipment is not currently lent out',
            );
        }

        const activeLending = (await this.grpcSdk.database!.findOne(
            'Lending',
            {
                equipment: equipmentId,
                requestStatus: 'approved',
            },
        )) as LendingRecord | null;


        await this.grpcSdk.database!.updateOne(
            'Equipment',
            { _id: equipmentId },
            {
                status: 'available',
                lentTo: null,
            } as any,
            undefined,
            user._id,
        );

        if (activeLending) {
            await this.grpcSdk.database!.updateOne(
                'Lending',
                { _id: activeLending._id },
                {
                    requestStatus: 'completed',
                } as any,
                undefined,
                user._id,
            );
        }

        const updatedEquipment = await this.grpcSdk.database!.findOne(
            'Equipment',
            { _id: equipmentId },
        );

        const updatedLending = activeLending
            ? await this.grpcSdk.database!.findOne('Lending', {
                _id: activeLending._id,
            })
            : null;

        return {
            example: {
                message: 'Equipment marked as returned successfully.',
                equipment: updatedEquipment,
                lending: updatedLending,
            },
        };
    }
    async deleteEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { equipmentId } = call.request.bodyParams as {
            equipmentId?: string;
        };

        if (!user) {
            throw new GrpcError(
                GrpcStatus.UNAUTHENTICATED,
                'Authentication required',
            );
        }

        if (!equipmentId || typeof equipmentId !== 'string') {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'equipmentId is required',
            );
        }

        const existingEquipment = await this.grpcSdk.database!.findOne(
            'Equipment',
            { _id: equipmentId },
        );

        if (!existingEquipment) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Equipment not found');
        }

        await this.grpcSdk.database!.deleteOne(
            'Equipment',
            { _id: equipmentId },
            user._id,
        );

        return {
            example: {
                message: 'Equipment deleted successfully.',
                equipmentId,
            },
        };
    }

}
