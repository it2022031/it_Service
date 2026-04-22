/**
 * Example roles for authorization demos. Extend as your domain grows.
 */
export var UserRole;
(function (UserRole) {
    UserRole["EMPLOYEE"] = "employee";
    UserRole["IT_STAFF"] = "itStaff";
    UserRole["ADMIN"] = "admin";
})(UserRole || (UserRole = {}));
