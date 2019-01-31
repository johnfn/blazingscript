import { Sexpr, S } from "../sexpr";
import { Scope } from "./context";

export type Loop = {
  continueLabel: string;
  breakLabel   : string;
  inc          : Sexpr | null;
};

export class Loops {
  static NumberOfLoopsSeen = 0;

  loops: Loop[];
  scope: Scope;

  constructor(scope: Scope) {
    this.scope = scope;
    this.loops = [];
  }

  add(inc: Sexpr | null): void {
    Loops.NumberOfLoopsSeen++;

    this.loops.push({
      continueLabel: `$loopcontinue${ Scope.NumberOfLoopsSeen }`,
      breakLabel   : `$loopbreak${ Scope.NumberOfLoopsSeen }`,
      inc
    });
  }

  pop() {
    this.loops.pop();
  }

  getCurrentLoop(): Loop {
    if (this.loops.length > 0) {
      return this.loops[this.loops.length - 1];
    } else {
      throw new Error("Requested getCurrentLoop when there was no loops on the stack.");
    }
  }

  getContinue(): Sexpr {
    const loopInfo = this.loops[
      this.loops.length - 1
    ];

    const res = S.Block([
      ...(loopInfo.inc ? [loopInfo.inc] : []),
      S("[]", "br", loopInfo.continueLabel)
    ]);

    return res;
  }

  getBreakLabel(): string {
    const loopStack = this.loops;

    return loopStack[loopStack.length - 1].breakLabel;
  }

  getContinueLabel(): string {
    const loopStack = this.loops;

    return loopStack[loopStack.length - 1].continueLabel;
  }

}