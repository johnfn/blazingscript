function getOffset(): number {
  return memread(0);
}

function setOffset(val: number): number {
  memwrite(0, val);

  return 0;
}

export function malloc(size: number): number {
  if (getOffset() === 0) {
    setOffset(100);
  }

  let offset = getOffset();

  setOffset(offset + size);

  return offset;
}
