import { Scope } from "./scope";

export type Module = {
  path: string;
};

export class Modules {
  list    : Module[];
  scope   : Scope;
  topScope: Scope;

  constructor(scope: Scope) {
    this.scope    = scope;
    this.topScope = scope.topmostScope();
    this.list     = [];
  }

  add(path: string): void {
    const list = this.topScope.modules.list;

    // Ensure we haven't already added this module.
    // TODO: Actually do proper directory filtering etc.
    if (list.filter(x => x.path === path)) {
      return;
    }

    this.topScope.modules.list.push({
      path: path,
    });
  }

  getAll(): Module[] {
    return this.topScope.modules.list;
  }
}