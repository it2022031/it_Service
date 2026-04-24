import {
    ConduitGrpcSdk,
    GrpcError,
    status as GrpcStatus,
} from '@conduitplatform/grpc-sdk';

import { TeamName } from '@it-service/common-types/lib/enums/TeamName.js';
import type { TeamRecord } from '../types/Team.js';

export async function getTeamByName(
    grpcSdk: ConduitGrpcSdk,
    name: TeamName,
): Promise<TeamRecord> {
    const team = await grpcSdk.database!.findOne<TeamRecord>(
        'Team',
        { name },
    );

    if (!team) {
        throw new GrpcError(
            GrpcStatus.NOT_FOUND,
            `Team ${name} not found`,
        );
    }

    return team;
}