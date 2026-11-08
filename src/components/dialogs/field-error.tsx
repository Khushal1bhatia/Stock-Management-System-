export function FieldError({ message }: { message?: string }) {
  return <span className={`field-error ${message ? "is-visible" : ""}`}>{message ?? ""}</span>;
}

export function invalidClass(error?: string) {
  return error ? "is-invalid" : "";
}

export function invalidAttrs(error?: string) {
  return error ? { "aria-invalid": true as const } : {};
}
