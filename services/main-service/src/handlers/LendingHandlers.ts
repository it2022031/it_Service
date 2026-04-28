import { ConduitGrpcSdk, GrpcError, ParsedRouterRequest, UnparsedRouterResponse ,status as GrpcStatus } from '@conduitplatform/grpc-sdk';
import { EquipmentAvailability } from '@it-service/common-types/lib/enums/EquipmentAvailability.js';
import { enumErrorMessage } from '../utils/ErrorMessage.js';
import { EquipmentStatus } from '@it-service/common-types/lib/enums/EquipmentStatus.js';
import { getTeamByName } from '../utils/Teams.js';
import { TeamName } from '@it-service/common-types/lib/enums/TeamName.js';
import { EquipmentRecord } from '../types/Equipment.js';
import { User } from '@it-service/common-types/lib/User.js';
import { LendingStatus } from '@it-service/common-types/lib/enums/LendingStatus.js';
import { LendingRecord } from '../types/Lending.js';
export class LendingHandlers {
    constructor(private readonly grpcSdk: ConduitGrpcSdk) {}



    async createLending(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { equipment } = call.request.bodyParams as {
            equipment: string;
        };

        const lendingData = {
            equipment,
            requestedBy: user._id,
            requestStatus: LendingStatus.PENDING,
        };

        const adminTeam = await getTeamByName(this.grpcSdk, TeamName.ADMINS);
        const itStaffTeam = await getTeamByName(this.grpcSdk, TeamName.IT_STAFF);

        const lending = await this.grpcSdk.database!.create<LendingRecord>(
            'Lending',
            lendingData,
        );

        await this.grpcSdk.authorization!.createRelation({
            subject: `User:${user._id}`,
            relation: 'reader',
            resource: `Lending:${lending._id}`,
        });

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${itStaffTeam._id}`,
            relation: 'owner',
            resource: `Lending:${lending._id}`,
        });

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${adminTeam._id}`,
            relation: 'owner',
            resource: `Lending:${lending._id}`,
        });

        return {
            message: 'Lending request created.',
            lending,
        };
    }
    async viewOwnRequests(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const lendings = await this.grpcSdk.database!.findMany<LendingRecord>(
            'Lending',
            {
                requestedBy: user._id,
            },
            {
                userId: user._id,
            },
        );

        return {
            message: 'User lendings fetched successfully.',
            count: lendings?.length ?? 0,
            lendings,
        };
    }
    async viewAllRequests(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const lendings = await this.grpcSdk.database!.findMany<LendingRecord>(
            'Lending',
            {},
            {
                userId: user._id,
            },
        );

        return {
            message: 'All lendings fetched successfully.',
            count: lendings?.length ?? 0,
            lendings,
        };
    }

    async reviewRequest(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { id } = call.request.urlParams as {
            id: string;
        };

        const { requestStatus } = call.request.bodyParams as {
            requestStatus: string;
        };

        if (
            requestStatus !== LendingStatus.APPROVED &&
            requestStatus !== LendingStatus.DECLINED
        ) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                'Request status must be APPROVED or DECLINED',
            );
        }

        const adminTeam = await getTeamByName(this.grpcSdk, TeamName.ADMINS);
        const adminScope = `Team:${adminTeam._id}`;

        const lending = await this.grpcSdk.database!.findOne<LendingRecord>(
            'Lending',
            { _id: id },
            undefined,
            undefined,
            user._id,
            adminScope,
        );

        if (!lending) {
            throw new GrpcError(GrpcStatus.NOT_FOUND, 'Lending not found');
        }

        if (lending.requestStatus !== LendingStatus.PENDING) {
            throw new GrpcError(
                GrpcStatus.FAILED_PRECONDITION,
                'Only pending requests can be reviewed',
            );
        }

        const updatedLending =
            await this.grpcSdk.database!.findByIdAndUpdate<LendingRecord>(
                'Lending',
                id,
                {
                    requestStatus: requestStatus as LendingStatus,
                },
                undefined,
                user._id,
                adminScope,
            );

        let updatedEquipment: EquipmentRecord | undefined;

        if (requestStatus === LendingStatus.APPROVED) {
            if (!lending.equipment) {
                throw new GrpcError(
                    GrpcStatus.FAILED_PRECONDITION,
                    'Lending does not have equipment',
                );
            }

            updatedEquipment =
                await this.grpcSdk.database!.findByIdAndUpdate<EquipmentRecord>(
                    'Equipment',
                    lending.equipment,
                    {
                        status: EquipmentStatus.UNAVAILABLE,
                    },
                    undefined,
                    user._id,
                    adminScope,
                );
        }

        return {
            message: 'Lending request reviewed successfully.',
            lending: updatedLending,
            equipment: updatedEquipment,
        };
    }


}