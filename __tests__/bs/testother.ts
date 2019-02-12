import { malloc } from "./malloc"

export function mytest(): number {
  return 5;
}

export class Foo {
  @property(0)
  a!: number;

  @property(4)
  b!: string;

  one(): void {

  }

  two(): void {

  }
}
