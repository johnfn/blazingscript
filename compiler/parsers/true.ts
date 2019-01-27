import { BSNode } from "../rewriter";

export class BSTrueKeyword extends BSNode {
  children: BSNode[];

  constructor() {
    super();

    this.children = [];
  }
}
