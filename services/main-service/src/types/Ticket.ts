import {TicketStatus} from "@it-service/common-types/lib/enums/TicketStatus.js";

export type TicketRecord = {
    _id: string;
    title: string;
    description: string;
    assignedTo?: string;
    createdBy: string;
    status: TicketStatus;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

