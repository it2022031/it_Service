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
import {EquipmentAvailability} from "@it-service/common-types/lib/enums/EquipmentAvailability.js";
import {EquipmentStatus} from "@it-service/common-types/lib/enums/EquipmentStatus.js";
import {LendingStatus} from "@it-service/common-types/lib/enums/LendingStatus.js";

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

        if (!Object.values(EquipmentAvailability).includes(availability as EquipmentAvailability)) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Availability must be active or retired',
            );
        }

        if (
            status !== undefined &&
            !Object.values(EquipmentStatus).includes(status as EquipmentStatus)
        ) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Status must be available or unavailable',
            );
        }

        const equipmentData = {
            name,
            description,
            availability,
            status: status ?? EquipmentStatus.UNAVAILABLE,
        };

        const equipment = await this.grpcSdk.database!.create(
            'Equipment',
            equipmentData,
        );

        return {
            userId: user._id,
            message: 'Equipment is created.',
            equipment,
        };
    }
    async listEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {

        const { status, availability, skip, limit } = call.request.queryParams as {
            status?: string;
            availability?: string;
            skip?: string;
            limit?: string;
        };

        const query: any = {};

        // availability filter (with default)
        if (availability) {
            if (!Object.values(EquipmentAvailability).includes(availability as EquipmentAvailability)) {
                throw new GrpcError(
                    GrpcStatus.INVALID_ARGUMENT,
                    'Invalid availability value',
                );
            }
            query.availability = availability;
        } else {
            query.availability = EquipmentAvailability.ACTIVE;
        }

        // status filter
        if (status) {
            if (!Object.values(EquipmentStatus).includes(status as EquipmentStatus)) {
                throw new GrpcError(
                    GrpcStatus.INVALID_ARGUMENT,
                    'Invalid status value',
                );
            }
            query.status = status;
        }

        const parsedSkip = skip ? parseInt(skip) : 0;
        const parsedLimit = limit ? parseInt(limit) : 10;

        const equipment = await this.grpcSdk.database!.findMany(
            'Equipment',
            query,
            undefined,
            undefined,
            {
                skip: parsedSkip,
                limit: parsedLimit,
            } as any,
        );

        return {
            message: 'Equipment fetched successfully.',
            count: equipment?.length ?? 0,
            skip: parsedSkip,
            limit: parsedLimit,
            equipment,
        };
    }
    async markReturnedEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { id: equipmentId } = call.request.params as {
            id: string;
        };

        const existingEquipment = await this.grpcSdk.database!.findOne<EquipmentRecord>(
            'Equipment',
            { _id: equipmentId },
        );

        if (!existingEquipment) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Equipment not found');
        }

        if (existingEquipment.status !== EquipmentStatus.UNAVAILABLE) {
            throw new GrpcError(
                GrpcStatus.FAILED_PRECONDITION,
                'Equipment is not currently lent out',
            );
        }

        const activeLending = await this.grpcSdk.database!.findOne<LendingRecord>(
            'Lending',
            {
                equipment: equipmentId,
                requestStatus: LendingStatus.APPROVED,
            },
        );

        const updatedEquipment = await this.grpcSdk.database!.findByIdAndUpdate<EquipmentRecord>(
            'Equipment',
            equipmentId,
            {
                $set: {
                    status: EquipmentStatus.AVAILABLE,
                },
                $unset: {
                    lentTo: '',
                },
            } as any,
            undefined,
            user._id,
        );

        const updatedLending = activeLending
            ? await this.grpcSdk.database!.findByIdAndUpdate<LendingRecord>(
                'Lending',
                activeLending._id,
                {
                    requestStatus: LendingStatus.COMPLETED,
                } as any,
                undefined,
                user._id,
            )
            : undefined;

        return {
            message: 'Equipment marked as returned successfully.',
            equipment: updatedEquipment,
            lending: updatedLending,
        };
    }
    async deleteEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { id: equipmentId } = call.request.params;

        const existingEquipment = await this.grpcSdk.database!.findOne<EquipmentRecord>(
            'Equipment',
            { _id: equipmentId },
        );

        if (!existingEquipment) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Equipment not found');
        }
        if (existingEquipment.status === EquipmentStatus.UNAVAILABLE) {
            throw new GrpcError(
                GrpcStatus.FAILED_PRECONDITION,
                'Cannot delete equipment that is currently lent out',
            );
        }

        await this.grpcSdk.database!.deleteOne(
            'Equipment',
            { _id: equipmentId },
            user._id,
        );

        return {
            message: 'Equipment deleted successfully.',
            equipmentId,
        };
    }

}


