export function enumErrorMessage(
    fieldName: string,
    enumValues: object,
): string {
    return `${fieldName} must be one of: ${Object.values(enumValues).join(', ')}`;
}
