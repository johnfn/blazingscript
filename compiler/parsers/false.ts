import { BSNode } from "../rewriter";

export class BSFalseKeyword extends BSNode {
  children: BSNode[];

  constructor() {
    super();

    this.children = [];
  }
}
