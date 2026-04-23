import {EquipmentAvailability} from "@it-service/common-types/lib/enums/EquipmentAvailability.js";
import {EquipmentStatus} from "@it-service/common-types/lib/enums/EquipmentStatus.js";

export type EquipmentRecord = {
    _id: string;
    name?: string;
    description?: string;
    availability?: EquipmentAvailability;
    status?: EquipmentStatus;
    lentTo?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};