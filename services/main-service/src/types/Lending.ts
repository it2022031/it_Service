export type LendingRecord = {
    _id: string;
    requestStatus?: 'pending' | 'approved' | 'declined' | 'completed';
    approvedAt?: string | Date;
    requestedBy?: string;
    equipment?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};