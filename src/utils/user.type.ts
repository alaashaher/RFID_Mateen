import { OBaseEntity } from "./o-base-entity.type";

export class User extends OBaseEntity {
    name?: string;
    mobile?: string;
    email?: string;
    otp?: boolean;
    superAdmin?: boolean;
    isActive?: boolean;
    password?: string;
    online?: boolean;
    lastSeen?: Date;
}