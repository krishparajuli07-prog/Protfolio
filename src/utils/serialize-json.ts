// A JSON string can contain </script>; HTML parsers recognize it even in JSON-LD.
export function serializeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
