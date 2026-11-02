export function formatOrderId(id: string) {
  return id.replace(/^KD-(\d+)$/, "RW-$1");
}
