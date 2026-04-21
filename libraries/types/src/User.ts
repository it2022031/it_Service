import { UserRole } from './enums/UserRole.js';

/**
 * Minimal User shape for service routes. Expand to match your Conduit User schema.
 */
export type User = {
    _id: string;
    role: UserRole;
};
