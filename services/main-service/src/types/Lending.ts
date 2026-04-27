import { LendingStatus } from '@it-service/common-types/lib/enums/LendingStatus.js';

export type LendingRecord = {
    _id: string;
    requestStatus?: LendingStatus;
    approvedAt?: string | Date;
    requestedBy?: string;
    equipment?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};
