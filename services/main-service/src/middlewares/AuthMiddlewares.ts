import {
    GrpcError,
    ParsedRouterRequest,
    status,
    UnparsedRouterResponse,
} from '@conduitplatform/grpc-sdk';
import { User } from '@it-service/common-types/lib/User.js';
import { UserRole } from '@it-service/common-types/lib/enums/UserRole.js';

const getUser = (call: ParsedRouterRequest): User => {
    const { user } = call.request.context as { user: User };

    if (!user) {
        throw new GrpcError(status.UNAUTHENTICATED, 'Authentication required');
    }

    return user;
};

export async function employeeMiddleware(
    call: ParsedRouterRequest,
): Promise<UnparsedRouterResponse> {
    const user = getUser(call);

    if (user.role !== UserRole.EMPLOYEE) {
        throw new GrpcError(
            status.PERMISSION_DENIED,
            'Endpoint requires employee role',
        );
    }

    return {};
}

export async function adminMiddleware(
    call: ParsedRouterRequest,
): Promise<UnparsedRouterResponse> {
    const user = getUser(call);

    if (user.role !== UserRole.ADMIN) {
        throw new GrpcError(
            status.PERMISSION_DENIED,
            'Endpoint requires admin role',
        );
    }

    return {};
}

export async function itStaffMiddleware(
    call: ParsedRouterRequest,
): Promise<UnparsedRouterResponse> {
    const user = getUser(call);

    if (user.role !== UserRole.IT_STAFF) {
        throw new GrpcError(
            status.PERMISSION_DENIED,
            'Endpoint requires it staff role',
        );
    }

    return {};
}

export async function adminOrEmployeeMiddleware(
    call: ParsedRouterRequest,
): Promise<UnparsedRouterResponse> {
    const user = getUser(call);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE) {
        throw new GrpcError(
            status.PERMISSION_DENIED,
            'Endpoint requires admin or employee role',
        );
    }

    return {};
}

export async function itStaffOrAdminMiddleware(
    call: ParsedRouterRequest,
): Promise<UnparsedRouterResponse> {
    const user = getUser(call);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.IT_STAFF) {
        throw new GrpcError(
            status.PERMISSION_DENIED,
            'Endpoint requires admin or it staff role',
        );
    }

    return {};
}
