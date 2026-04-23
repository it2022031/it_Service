export type EquipmentRecord = {
    _id: string;
    name?: string;
    description?: string;
    availability?: 'active' | 'retired';
    status?: 'available' | 'unavailable';
    lentTo?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};