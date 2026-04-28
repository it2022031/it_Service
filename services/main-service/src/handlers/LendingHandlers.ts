import { ConduitGrpcSdk, GrpcError, ParsedRouterRequest, UnparsedRouterResponse ,status as GrpcStatus } from '@conduitplatform/grpc-sdk';
import { EquipmentAvailability } from '@it-service/common-types/lib/enums/EquipmentAvailability.js';
import { enumErrorMessage } from '../utils/ErrorMessage.js';
import { EquipmentStatus } from '@it-service/common-types/lib/enums/EquipmentStatus.js';
import { getTeamByName } from '../utils/Teams.js';
import { TeamName } from '@it-service/common-types/lib/enums/TeamName.js';
import { EquipmentRecord } from '../types/Equipment.js';
import { User } from '@it-service/common-types/lib/User.js';
export class LendingHandlers {
    constructor(private readonly grpcSdk: ConduitGrpcSdk) {}



    async createEquipment(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        const { name, description, availability, status } = call.request
            .bodyParams as {
            name: string;
            description: string;
            availability: string;
            status: string;
        };

        if (
            !Object.values(EquipmentAvailability).includes(
                availability as EquipmentAvailability,
            )
        ) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                enumErrorMessage('Availability', EquipmentAvailability),
            );
        }

        if (!Object.values(EquipmentStatus).includes(status as EquipmentStatus)) {
            throw new GrpcError(
                GrpcStatus.INVALID_ARGUMENT,
                enumErrorMessage('Status', EquipmentStatus),
            );
        }

        const equipmentData = {
            name,
            description,
            availability: availability as EquipmentAvailability,
            status: status as EquipmentStatus,
        };

        const adminTeam = await getTeamByName(this.grpcSdk, TeamName.ADMINS);
        const itStaffTeam = await getTeamByName(this.grpcSdk, TeamName.IT_STAFF);
        const employeesTeam = await getTeamByName(
            this.grpcSdk,
            TeamName.EMPLOYEES,
        );

        const equipment = await this.grpcSdk.database!.create<EquipmentRecord>(
            'Equipment',
            equipmentData,
            user._id,
        );

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${adminTeam._id}`,
            relation: 'owner',
            resource: `Equipment:${equipment._id}`,
        });

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${itStaffTeam._id}`,
            relation: 'owner',
            resource: `Equipment:${equipment._id}`,
        });

        await this.grpcSdk.authorization!.createRelation({
            subject: `Team:${employeesTeam._id}`,
            relation: 'reader',
            resource: `Equipment:${equipment._id}`,
        });

        return {
            userId: user._id,
            message: 'Equipment is created.',
            equipment,
        };
    }
}