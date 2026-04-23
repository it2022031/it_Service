export type TicketRecord = {
    _id: string;
    title?: string;
    description?: string;
    assignedTo?: string;
    createdBy?: string;
    status?: 'pending' | 'inProgress' | 'completed' | 'rejected';
    createdAt?: string | Date;
    updatedAt?: string | Date;
};