import {
    ConduitGrpcSdk,
    GrpcError,
    ParsedRouterRequest,
    status,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { User } from '@it-service/common-types/lib/User.js';
// import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

export class RoleHandlers {
    constructor(private readonly grpcSdk: ConduitGrpcSdk) {}

    async getMyRole(
        call: ParsedRouterRequest,
    ): Promise<UnparsedRouterResponse> {
        const { user } = call.request.context as { user: User };

        if (!user) {
            throw new GrpcError(
                status.UNAUTHENTICATED,
                'Authentication required',
            );
        }

        const fullUser = (await this.grpcSdk.database!.findOne('User', {
            _id: user._id,
        })) as User | null;

        return {
            userId: user._id,
            role: fullUser?.role ?? user.role,
        };
    }
}
