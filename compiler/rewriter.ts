import ts, { SyntaxKind, FunctionDeclaration, ParameterDeclaration, Block, Statement, ReturnStatement, Expression, BinaryExpression, Identifier, SourceFile, NodeArray, ExpressionStatement, CallExpression, LiteralExpression, VariableStatement, IfStatement, ConditionalExpression, PostfixUnaryExpression, StringLiteral, PrefixUnaryExpression, FlowFlags, ObjectLiteralExpression } from 'typescript';
import { Param, Sexpr, Sx, S } from './sexpr';
import { Program } from './program';

function assert(x: boolean, msg = "") {
  if (x !== true) {
    throw new Error(msg)
  }
}

type Context = {
  blockNameStack: string[];
}

export function flatten<T>(x: T[][]): T[] {
  const result: T[] = [];

  for (const a of x) {
    for (const b of a) {
      result.push(b);
    }
  }

  return result;
}

function strnode(node: ts.Node, indent = 0): string {
  return (
    new Array(indent + 1).join(' ') + ts.SyntaxKind[node.kind] + '\n' +
    ts.forEachChild(node, node => strnode(node, indent + 1))
  );
}

function sn(node: ts.Node): string {
  return node.getChildren().map(x => `[${ x.getText() }]`).join(", ")
}

export class Rewriter {
  ctx: Context;

  constructor(
    private root   : ts.Node,
    private program: Program
  ) {
    this.ctx = { 
      blockNameStack: []
    };
  }

  parse(): Sexpr {
    return this.parseHelper(this.root);
  }

  parseParameterList(nodes: NodeArray<ParameterDeclaration>, functionName: string): Param[] {
    const result: Param[] = [];

    for (const n of nodes) {
      const type = this.program.typeChecker.getTypeAtLocation(n);
      let wasmType = "";

      if (type.flags & ts.TypeFlags.Number) {
        wasmType = "i32";
      } else {
        if (functionName !== "clog") {
          throw new Error("Unsupported type!")
        } else {
          wasmType = "i32";
        }
      }

      result.push({
        name       : n.name.getText(),
        type       : wasmType,
        declaration: n,
      });
    }

    return result;
  }

  parseHelper(node: ts.Node): Sexpr {
    if (node.kind === SyntaxKind.SourceFile) {
      const sf = node as SourceFile;

      // find all exported functions

      const exportedFunctions: string[] = [];
      for (const statement of sf.statements) {
        if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
          const fd = statement as FunctionDeclaration;
          const name = fd.name && fd.name.getText();

          if (name) {
            exportedFunctions.push(name)
          } else {
            throw new Error("unnamed functions are not supported.");
          }
        }
      }

      // TODO: this memory stuff should be figured out?

      return S(
        "[]",
        "module",
        S("[]", "import", '"js"', '"mem"', S("[]", "memory", "1")),
        S("[]", "import", '"console"', '"log"', S("[]", "func", "$log", S("[]", "param", "i32"))),
        S("[]", "import", '"c"', '"log"', 
          S("[]", "func", "$clog", 
          S("[]", "param", "i32"), 
          S("[]", "param", "i32"),
          S("[]", "param", "i32"), 
          S("[]", "param", "i32"),
          S("[]", "param", "i32"), 
          S("[]", "param", "i32"),
          S("[]", "param", "i32"),
          S("[]", "param", "i32"), 
          S("[]", "param", "i32"),
          )),
        ...this.parseStatementList(sf.statements),
        ...(
          exportedFunctions.map(fnname => S.Export(fnname, "func"))
        )
      );
    }

    throw new Error('Unhandled base thing');
  }

  parseFunction(node: FunctionDeclaration): Sexpr {
    const functionName = node.name!.text;
    const params = this.parseParameterList(node.parameters, functionName)
    const sb = this.parseStatementList(node.body!.statements);

    const allVarDecls: { name: ts.BindingName, type: "i32" }[] = [];

    // traverse function ahead of time to find variable declarations, which need to go up front

    for (const statement of node.body!.statements) {
      if (statement.kind === ts.SyntaxKind.VariableStatement) {
        const vs = statement as VariableStatement;

        for (const decl of vs.declarationList.declarations) {
          const type = this.program.typeChecker.getTypeAtLocation(decl);

          if (!(type.flags & ts.TypeFlags.Number) && !(type.flags & ts.TypeFlags.NumberLiteral)) {
            throw new Error(`Do not know how to handle that type: ${ ts.TypeFlags[type.flags] } for ${ statement.getText() }`);
          }

          allVarDecls.push({
            name: decl.name,
            type: "i32",
          })
        }
      }
    }

    return S.Func({
      name: functionName,
      body: [
        ...(allVarDecls.map(decl => S.DeclareLocal(decl.name.getText(), decl.type))),
        ...sb
      ],
      params: params
    });
  }

  parseIfStatement(node: IfStatement): Sexpr {
    const blockName = "$ifblock";

    this.ctx.blockNameStack.push(blockName);

    let thn = this.parseStatement(node.thenStatement) || S.Const("i32", 0);
    let els = node.elseStatement ? this.parseStatement(node.elseStatement) : undefined;

    if (thn.type !== "i32") {
      thn = S.WrapWithType("i32", [thn]);
    }

    if (els && els.type !== "i32") {
      els = S.WrapWithType("i32", [els]);
    }

    const result = S(
      "i32",
      "if",
      "(result i32)",
      this.parseExpression(node.expression),
      S("i32", "then", thn),
      S("i32", "else", els ? els : S.Const("i32", 0)),
    )

    assert(this.ctx.blockNameStack.pop() === blockName, "bad block name stack");

    return result;
  }

  parseVariableStatement(vs: VariableStatement): Sexpr | null {
    for (const mod of vs.modifiers || []) {
      switch (mod.kind) {
        case SyntaxKind.DeclareKeyword:
          return null;
        case SyntaxKind.AbstractKeyword:
        case SyntaxKind.AsyncKeyword:
        case SyntaxKind.ConstKeyword:
        case SyntaxKind.DefaultKeyword:
        case SyntaxKind.ExportKeyword:
        case SyntaxKind.PublicKeyword:
        case SyntaxKind.PrivateKeyword:
        case SyntaxKind.ProtectedKeyword:
        case SyntaxKind.ReadonlyKeyword:
        case SyntaxKind.StaticKeyword:
      }
    }

    if (vs.declarationList.declarations.length > 1) {
      throw new Error("Cant handle more than 1 declaration!!!");
    }

    const decl = vs.declarationList.declarations[0];

    if (decl.name.kind === ts.SyntaxKind.Identifier) {
      const name = decl.name.getText();

      return S.SetLocal(name, decl.initializer ? this.parseExpression(decl.initializer) : S.Const("i32", 0));
    } else {
      throw new Error("I dont handle destructuring in variable names");
    }
  }

  parseExpressionStatement(es: ExpressionStatement): Sexpr {
    return this.parseExpression(es.expression);
  }

  parseExpression(expression: Expression): Sexpr {
    if (expression.kind === SyntaxKind.BinaryExpression) {
      const be = expression as BinaryExpression;
      const type = this.program.typeChecker.getTypeAtLocation(be.left);
      let fn: string | undefined;

      if ((type.flags & ts.TypeFlags.Number) || type.isNumberLiteral() || type.flags && ts.TypeFlags.Boolean) {
        const functionMapping: { [key in ts.BinaryOperator]: string | undefined } = {
          [ts.SyntaxKind.CommaToken                            ]: undefined,
          [ts.SyntaxKind.LessThanToken                         ]: undefined,
          [ts.SyntaxKind.GreaterThanToken                      ]: undefined,
          [ts.SyntaxKind.LessThanEqualsToken                   ]: undefined,
          [ts.SyntaxKind.GreaterThanEqualsToken                ]: undefined,
          [ts.SyntaxKind.EqualsEqualsToken                     ]: undefined,
          [ts.SyntaxKind.EqualsEqualsEqualsToken               ]: "i32.eq",
          [ts.SyntaxKind.ExclamationEqualsToken                ]: undefined,
          [ts.SyntaxKind.ExclamationEqualsEqualsToken          ]: undefined,
          [ts.SyntaxKind.AsteriskAsteriskToken                 ]: undefined,
          [ts.SyntaxKind.PercentToken                          ]: undefined,
          [ts.SyntaxKind.LessThanLessThanToken                 ]: undefined,
          [ts.SyntaxKind.GreaterThanGreaterThanToken           ]: undefined,
          [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: undefined,
          [ts.SyntaxKind.AmpersandToken                        ]: undefined,
          [ts.SyntaxKind.BarToken                              ]: undefined,
          [ts.SyntaxKind.CaretToken                            ]: undefined,  
          [ts.SyntaxKind.AmpersandAmpersandToken               ]: "i32.and",              
          [ts.SyntaxKind.BarBarToken                           ]: undefined, 
          [ts.SyntaxKind.EqualsToken                           ]: undefined,
          [ts.SyntaxKind.PlusEqualsToken                       ]: undefined,
          [ts.SyntaxKind.MinusEqualsToken                      ]: undefined,
          [ts.SyntaxKind.AsteriskEqualsToken                   ]: undefined,
          [ts.SyntaxKind.AsteriskAsteriskEqualsToken           ]: undefined,
          [ts.SyntaxKind.SlashEqualsToken                      ]: undefined,
          [ts.SyntaxKind.PercentEqualsToken                    ]: undefined,
          [ts.SyntaxKind.LessThanLessThanEqualsToken           ]: undefined,
          [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken     ]: undefined,
          [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: undefined,
          [ts.SyntaxKind.AmpersandEqualsToken                  ]: undefined,
          [ts.SyntaxKind.BarEqualsToken                        ]: undefined,
          [ts.SyntaxKind.CaretEqualsToken                      ]: undefined,
          [ts.SyntaxKind.InKeyword                             ]: undefined,
          [ts.SyntaxKind.InstanceOfKeyword                     ]: undefined,

          [ts.SyntaxKind.PlusToken]                            : "i32.add",
          [ts.SyntaxKind.MinusToken]                           : "i32.sub",
          [ts.SyntaxKind.AsteriskToken]                        : "i32.mul",
          [ts.SyntaxKind.SlashToken]                           : "i32.div",
        };

        if (!(be.operatorToken.kind in functionMapping)) {
          throw new Error(`Unhandled binary operation! ${ be.operatorToken.kind}`)
        }

        fn = functionMapping[be.operatorToken.kind];
      } else {
        throw new Error(`Dunno how to add that gg. ${ (type as any).intrinsicName }`);
      }

      if (fn === undefined) {
        throw new Error(`Unsupported binary operation: ${ ts.SyntaxKind[be.operatorToken.kind] }`);
      }

      // TODO: Mop up this intrinsic name stuff

      return S(
        "i32",
        fn,
        this.parseExpression(be.left),
        this.parseExpression(be.right),
      );
    }

    if (expression.kind === SyntaxKind.CallExpression) {
      const ce: CallExpression = expression as CallExpression;

      // TODO: I actualy have to resolve the lhs

      // tho to be fair, i dont know how to call anything at all rn.

      // if (ce.expression.kind !== ts.SyntaxKind.FunctionExpression) {
      //   throw new Error(`dunno how to call anything thats not exactly a function, got ${ ts.SyntaxKind[ce.expression.kind] }`)
      // }

      if (ce.expression.getText() === "console.log") {
        if (ce.arguments.length !== 1) {
          throw new Error("unhandled log w/o 1 arg");
        }

        return S(
          "[]",
          "call",
          "$log",
          this.parseExpression(ce.arguments[0]),
        );
      } else if (ce.expression.getText() === "mset") {
        return S.Store(
          this.parseExpression(ce.arguments[0]),
          this.parseExpression(ce.arguments[1]),
        );
      } else if (ce.expression.getText() === "mget") {
        return S.Load(
          "i32",
          this.parseExpression(ce.arguments[0]),
        );
      } else if (ce.expression.getText() === "clog") {
        const logArgs: {
          size : number;
          start: number;
          type : number;
          putValueInMemory: Sexpr[];
        }[] = [];

        let offset = 0;

        for (const arg of ce.arguments) {
          if (arg.kind === ts.SyntaxKind.StringLiteral) {
            const str = arg.getText().slice(1, -1);

            logArgs.push({
              size : str.length,
              start: offset,
              type : 0,
              putValueInMemory: Sx.SetStringLiteralAt(offset, str),
            });

            offset += str.length;
          } else if (arg.kind === ts.SyntaxKind.NumericLiteral) {
            const num = Number(arg.getText());

            logArgs.push({
              size : 4,
              start: offset,
              type : 1,
              putValueInMemory: [
                S.Store(
                  S.Const("i32", offset),
                  S.Const("i32", num)
                )
              ],
            });

            offset += 4;
          } else if (arg.kind === ts.SyntaxKind.Identifier) {
            logArgs.push({
              size : 4,
              start: offset,
              type : 1,
              putValueInMemory: [
                S.Store(
                  S.Const("i32", offset),
                  S.GetLocal("i32", arg.getText()),
                )
              ],
            });

            offset += 4;
          } else {
            logArgs.push({
              size : 4,
              start: offset,
              type : 1,
              putValueInMemory: [
                S.Store(
                  S.Const("i32", offset),
                  this.parseExpression(arg),
                )
              ],
            });

            offset += 4;
          }
        }

        while (logArgs.length < 3) {
          logArgs.push({
            size : 0,
            start: 0,
            type : 9999,
            putValueInMemory: [S("[]", "nop")],
          });
        }

        return S.Wrap(
          "i32", [
            // store all args into memory

            ...flatten(logArgs.map(obj => obj.putValueInMemory)),

            S(
              "[]",
              "call",
              "$clog",
              ...flatten(
                logArgs.map(obj => [
                  S.Const("i32", obj.type),
                  S.Const("i32", obj.start),
                  S.Const("i32", obj.start + obj.size),
                ])
              ),
            ),
            S.Const("i32", 0)
          ]
        );
      } else {
        return S(
          "i32", 
          "call", "$" + ce.expression.getText(),
          ...ce.arguments.map(arg => this.parseExpression(arg))
        )
      }
    }

    if (expression.kind === SyntaxKind.Identifier) {
      const id = expression as Identifier;

      // TODO this is wrong (as is any use of get text im pretty sure)

      return S.GetLocal("i32", id.getText());
    }

    if (expression.kind === SyntaxKind.FirstLiteralToken) {
      const t = expression as LiteralExpression;

      // TODO: Handle types e.g. anything thats not a number, lol

      return S.Const("i32", Number(t.getText()));
    }

    if (expression.kind === SyntaxKind.ConditionalExpression) {
      const t = expression as ConditionalExpression;

      // TODO this is wrong because it always evaluates both sides
      return S("i32", "select",
        this.parseExpression(t.whenTrue),
        this.parseExpression(t.whenFalse),
        this.parseExpression(t.condition),
      );
    }

    if (expression.kind === SyntaxKind.PostfixUnaryExpression) {
      const pue = expression as PostfixUnaryExpression;

      // TODO: Check types!
      // TODO: Return previous value.
      return S.SetLocal(pue.operand.getText(), S(
          "i32",
          "i32.add",
          this.parseExpression(pue.operand),
          S.Const("i32", 1),
        )
      );
    }

    if (expression.kind === SyntaxKind.TrueKeyword) {
      return S.Const("i32", 1);
    }

    if (expression.kind === SyntaxKind.FalseKeyword) {
      return S.Const("i32", 0);
    }

    if (expression.kind === SyntaxKind.PrefixUnaryExpression) {
      const pue = expression as PrefixUnaryExpression;

      return S(
        "i32",
        "if",
        S("[]", "result", "i32"),
        S("i32", "i32.eq", this.parseExpression(pue.operand), S.Const("i32", 0)),
        S.Const("i32", 1),
        S.Const("i32", 0),
      );
    }

    console.log(expression.kind);

    throw new Error(`Unhandled expression! ${ ts.SyntaxKind[expression.kind] }`);
  }

  parseBlock(block: Block): Sexpr {
    return S.Wrap("i32", this.parseStatementList(block.statements));
  }

  parseReturnStatement(rs: ReturnStatement): Sexpr {
    if (!rs.expression) {
      throw new Error("Unhandled: empty return");
    }

    return S("[]", "return",
      this.parseExpression(rs.expression),
    );
  }

  parseStatement(statement: Statement): Sexpr | null {
    switch (statement.kind) {
      case SyntaxKind.ExpressionStatement:
        return this.parseExpressionStatement(statement as ExpressionStatement);
      case SyntaxKind.ReturnStatement:
        return this.parseReturnStatement(statement as ReturnStatement);
      case SyntaxKind.FunctionDeclaration:
        return this.parseFunction(statement as FunctionDeclaration);
      case SyntaxKind.Block:
        return this.parseBlock(statement as Block);
      case SyntaxKind.IfStatement:
        return this.parseIfStatement(statement as IfStatement);
      case SyntaxKind.VariableStatement:
        const vs = statement as VariableStatement;

        return this.parseVariableStatement(vs);
      case SyntaxKind.TypeAliasDeclaration:
        return null;
      default:
        throw new Error(`unhandled statement! ${ ts.SyntaxKind[statement.kind] }`);
    }
  }

  parseStatementList(list: ts.NodeArray<ts.Statement>): Sexpr[] {
    let results: Sexpr[] = [];

    for (const statement of list) {
      const parsed = this.parseStatement(statement);

      if (parsed) {
        results = results.concat(parsed);
      }
    }

    return results;
  }
}