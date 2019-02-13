import { malloc } from "./malloc";

@jsType("Array")
export class ArrayImpl {
  @property(0)
  private allocatedLength = 0;

  @property(4)
  length = 0;

  @property(8)
  private contents = 0;

  [key: number]: number;
  @operator("[]")
  getAddress(i: number): number {
    return this.contents + i * 4;
  }

  private reallocate() {
    this.allocatedLength = this.allocatedLength * 2;

    const newContent = malloc(this.allocatedLength * 4);

    for (let i = 0; i < this.length; i++) {
      memwrite(newContent + i * 4, this[i]);
    }

    this.contents = newContent;

    return 1;
  }

  push(value: number): number {
    if (this.length >= this.allocatedLength) {
      this.reallocate();
    }

    this[this.length] = value;
    this.length = this.length + 1;

    return 1;
  }

  indexOf(value: number): number {
    for (let i = 0; i < this.length; i++) {
      if (this[i] === value) {
        return i;
      }
    }

    return -1;
  }

  private constructArrayWithSize(size: number): number[] {
    const result: ArrayImpl = malloc(4 * 4) as any as ArrayImpl;

    result.contents        = malloc((size + 1) * 4);
    result.allocatedLength = (size + 1) * 4;
    result.length          = size;

    return result as any as number[];
  }

  concat(secondArray: number[]): number[] {
    const myLength = this.length;
    const result = this.constructArrayWithSize(myLength + secondArray.length);

    for (let i = 0; i < myLength; i++) {
      result[i] = this[i];
    }

    for (let j = 0; j < secondArray.length; j++) {
      result[j + myLength] = secondArray[j];
    }

    return result as any;
  }

  reverse(): number[] {
    const myLength = this.length;
    let temp = 0;

    for (let i = 0; i < myLength / 2; i++) {
      temp = this[i];

      this[i] = this[this.length - i - 1];
      this[this.length - i - 1] = temp;
    }

    return this as any;
  }

  map(fn: (val: number) => number): number[] {
    const result = this.constructArrayWithSize(this.length);

    for (let i = 0; i < result.length; i++) {
      result[i] = fn(this[i]);
    }

    return result;
  }
}