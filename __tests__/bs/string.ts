import { malloc } from "./malloc";

@jsType("String")
export class StringImpl {
  @property(0)
  readonly length: number = 0;

  charCodeAt(i: number): number {
    return memread(((this as any) as number) + 4 + i) & 0x000000ff;
  }

  @operator("===")
  __equals(other: string): boolean {
    const myLen    = this.length;
    const otherLen = other.length;

    if (myLen !== otherLen) {
      return false;
    }

    for (let i = 0; i < myLen; i++) {
      if (this.charCodeAt(i) !== other.charCodeAt(i)) {
        return false;
      }
    }

    return true;
  }

  @operator("!==")
  __notEquals(str: string): boolean {
    return !this.__equals(str);
  }

  charAt(i: number): string {
    const charCode = memread(((this as any) as number) + 4 + i) & 0x000000ff;
    const newStr = malloc(4 + 1);

    memwrite(newStr + 0, 1);
    memwrite(newStr + 4, charCode);

    return (newStr as any) as string;
  }

  [key: number]: string;
  @operator("[]")
  index(i: number): string {
    return this.charAt(i);
  }

  indexOf(needle: string): number {
    const needleLen = needle.length;
    const haystackLen = this.length;

    for (
      let haystackStartPos = 0;
      haystackStartPos < haystackLen;
      haystackStartPos++
    ) {
      let curPos = 0;

      for (
        curPos = haystackStartPos;
        curPos < haystackStartPos + needleLen;
        curPos++
      ) {
        if (curPos > haystackLen) {
          break;
        }

        if (this.charAt(curPos) === needle.charAt(curPos - haystackStartPos)) {
          continue;
        } else {
          break;
        }
      }

      if (curPos === haystackStartPos + needleLen) {
        return haystackStartPos;
      }
    }

    return -1;
  }

  lastIndexOf(needle: string): number {
    const needleLen = needle.length;
    const haystackLen = this.length;

    const startPos = this.length - needle.length;

    if (startPos < 0) {
      return -1;
    }

    for (
      let haystackStartPos = startPos;
      haystackStartPos >= 0;
      haystackStartPos--
    ) {
      let curPos = 0;

      for (
        curPos = haystackStartPos;
        curPos < haystackStartPos + needleLen;
        curPos++
      ) {
        if (curPos > haystackLen) {
          break;
        }

        if (this.charAt(curPos) === needle.charAt(curPos - haystackStartPos)) {
          continue;
        } else {
          break;
        }
      }

      if (curPos === haystackStartPos + needleLen) {
        return haystackStartPos;
      }
    }

    return -1;
  }

  @operator("+")
  __concat(other: string): string {
    const myLen = this.length;
    const otherLen = other.length;
    const newLength = myLen + otherLen;
    const newStr = malloc(newLength + 4);

    memwrite(newStr + 0, newLength);

    for (let i = 0; i < this.length; i++) {
      memwrite(newStr + 4 + i, this.charCodeAt(i));
    }

    for (let j = 0; j < other.length; j++) {
      memwrite(newStr + 4 + myLen + j, other.charCodeAt(j));
    }

    return (newStr as any) as string;
  }

  endsWith(innerString: string): boolean {
    const start = this.length - innerString.length;

    if (start < 0) { return false; }

    for (let i = start; i < this.length; i++) {
      if (this.charCodeAt(i) !== innerString.charCodeAt(i - start)) {
        return false;
      }
    }

    return true;
  }

  includes(otherString: string): boolean {
    return this.indexOf(otherString) > -1;
  }

  repeat(times: number): string {
    const size   = times * this.length;
    const result = malloc(4 + size);

    memwrite(result as any as number, size);

    for (let i = 0; i < size; i++) {
      memwrite(result as any as number + i + 4, this.charCodeAt(i % this.length));
    }

    return result as any as string;
  }
}