import { BSNode } from "../rewriter";

import { ClassElement } from "typescript";

export class BSClassElement extends BSNode {
  children: BSNode[] = [];

  constructor(node: ClassElement) {
    super();

    console.log("should probably do something here....");
  }
}
