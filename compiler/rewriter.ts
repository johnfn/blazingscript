import ts, { SyntaxKind, FunctionDeclaration, ParameterDeclaration, Block, Statement, ReturnStatement, Expression, BinaryExpression, Identifier, SourceFile, NodeArray, ExpressionStatement, CallExpression, LiteralExpression, VariableStatement, IfStatement, ConditionalExpression, PostfixUnaryExpression } from 'typescript';
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

  parseParameterList(nodes: NodeArray<ParameterDeclaration>): Param[] {
    const result: Param[] = [];

    for (const n of nodes) {
      const type = this.program.typeChecker.getTypeAtLocation(n);
      const name = type.intrinsicName;
      let wasmType = "";

      if (name === "number") {
        wasmType = "i32";
      } else {
        throw new Error("Unsupported type!")
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

      // TODO: this memory stuff should be figured out?

      return S(
        "module",
        S("import", '"js"', '"mem"', S("memory", "1")),
        S("import", '"console"', '"log"', S("func", "$log", S("param", "i32"))),
        S("import", '"c"', '"log"', S("func", "$clog", S("param", "i32"), S("param", "i32"))),
        ...this.parseStatementList(sf.statements),
      );
    }

    throw new Error('Unhandled base thing');
  }

  parseFunction(node: FunctionDeclaration): Sexpr[] {
    const functionName = node.name!.text;
    const params = this.parseParameterList(node.parameters)
    const sb = this.parseStatementList(node.body!.statements);

    return [
      S.Func({
        name: functionName,
        body: sb,
        params: params
      }),
      S.Export(functionName, "func")
    ];
  }

  parseIfStatement(node: IfStatement): Sexpr[] {
    const blockName = "$ifblock";

    this.ctx.blockNameStack.push(blockName);

    const result = [
      "(if",
      "(block (result i32)",
      ...this.parseExpression(node.expression),
      ")",
      "(then",
      ...this.parseStatement(node.thenStatement),
      ")",
      ...(node.elseStatement
        ? [
          "(else",
          ...this.parseStatement(node.elseStatement),
          ")",
        ] : []
      ),
      ")",
    ];

    assert(this.ctx.blockNameStack.pop() === blockName, "bad block name stack");

    return result;
  }

  parseVariableStatement(vs: VariableStatement): Sexpr[] {
    return flatten(vs.declarationList.declarations.map(decl => {
      if (decl.name.kind === ts.SyntaxKind.Identifier) {
        const name = decl.name.getText();

        return [
          S.Local(name, "i32"),
          ...S.SetLocal(name, decl.initializer ? this.parseExpression(decl.initializer) : S.Const(0))
        ];
      } else {
        throw new Error("I dont handle destructuring in variable names");
      }
    }));
  }

  parseExpression(expression: Expression): Sexpr[] {
    if (expression.kind === SyntaxKind.BinaryExpression) {
      const be = expression as BinaryExpression;
      const type = this.program.typeChecker.getTypeAtLocation(be.left);
      let fn: string | undefined;

      if (type.intrinsicName === "number" || type.isNumberLiteral()) {
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
          [ts.SyntaxKind.AmpersandAmpersandToken               ]: undefined,              
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
        throw new Error(`Dunno how to add that gg. ${ type.intrinsicName }`);
      }

      if (fn === undefined) {
        throw new Error(`Unsupported binary operation: ${ ts.SyntaxKind[be.operatorToken.kind] }`);
      }

      // TODO: Mop up this intrinsic name stuff

      return [
        ...this.parseExpression(be.left),
        ...this.parseExpression(be.right),
        fn,
      ];
    }

    if (expression.kind === SyntaxKind.CallExpression) {
      // TODO: I think this line is wrong.

      const ce: CallExpression = expression;

      // TODO: I actualy have to resolve the lhs

      // tho to be fair, i dont know how to call anything at all rn.

      // if (ce.expression.kind !== ts.SyntaxKind.FunctionExpression) {
      //   throw new Error(`dunno how to call anything thats not exactly a function, got ${ ts.SyntaxKind[ce.expression.kind] }`)
      // }

      if (ce.expression.getText() === "console.log") {
        if (ce.arguments.length !== 1) {
          throw new Error("unhandled log w/o 1 arg");
        }

        return [
          ...this.parseExpression(ce.arguments[0]),
          "call",
          "$log",
        ]
      } else if (ce.expression.getText() === "clog") {
        // ...flatten(ce.arguments.map(x => this.parseExpression(x))),

        if (ce.arguments.length !== 1) {
          throw new Error(`cant clog with more (or less) than 1 argument. got ${ ce.arguments.length }.`);
        }

        const arg = ce.arguments[0];

        if (arg.kind !== ts.SyntaxKind.StringLiteral) {
          throw new Error("cant clog anything which is not a string literal. lol");
        }

        const text = arg.getText().slice(1, -1);

        return [
          ...Sx.SetStringLiteralAt(0, text),
          "i32.const", String(0),               // start
          "i32.const", String(0 + text.length), // end
          "call", "$clog"
        ];
      } else {
        throw new Error(`Unhandled call expression ${ expression.getText() }`);
      }
    }

    if (expression.kind === SyntaxKind.Identifier) {
      const id = expression as Identifier;

      return [
        "get_local",
        "$" + id.escapedText,
      ]
    }

    if (expression.kind === SyntaxKind.FirstLiteralToken) {
      const t = expression as LiteralExpression;

      // TODO: Handle types

      return [
        "i32.const",
        t.getText(),
      ];
    }

    if (expression.kind === SyntaxKind.ConditionalExpression) {
      const t = expression as ConditionalExpression;

      return [
        ...this.parseExpression(t.whenTrue),
        ...this.parseExpression(t.whenFalse),
        ...this.parseExpression(t.condition),
        "select"
      ];
    }

    if (expression.kind === SyntaxKind.PostfixUnaryExpression) {
      const pue = expression as PostfixUnaryExpression;

      // TODO: Check types!
      // TODO: Return previous value.
      return [
        ...S.SetLocal(pue.operand.getText(), [
          ...this.parseExpression(pue.operand),
          ...S.Const(1),
          "i32.add",
        ])
      ];
    }

    console.log(expression.kind);

    throw new Error(`Unhandled expression! ${ ts.SyntaxKind[expression.kind] }`);
  }

  parseBlock(block: Block): Sexpr[] {
    return this.parseStatementList(block.statements);
  }

  parseStatement(statement: Statement): Sexpr[] {
    if (statement.kind === ts.SyntaxKind.ExpressionStatement) {
      const es: ExpressionStatement = statement as ExpressionStatement;

      return [ ...this.parseExpression(es.expression) ];
    }

    if (statement.kind === ts.SyntaxKind.ReturnStatement) {
      const rs: ReturnStatement = statement as ReturnStatement;

      if (!rs.expression) {
        throw new Error("Unhandled");
      }

      return [
        ...this.parseExpression(rs.expression),
        "return",
      ];
    }

    switch (statement.kind) {
      case SyntaxKind.FunctionDeclaration:
        return this.parseFunction(statement as FunctionDeclaration);
      case SyntaxKind.Block:
        return this.parseBlock(statement as Block);
      case SyntaxKind.IfStatement:
        return this.parseIfStatement(statement as IfStatement);
      case SyntaxKind.VariableStatement:
        const vs = statement as VariableStatement;

        return this.parseVariableStatement(vs);
    }

    throw new Error(`unhandled statement! ${ ts.SyntaxKind[statement.kind] }`);
  }

  parseStatementList(list: ts.NodeArray<ts.Statement>): Sexpr[] {
    let results: Sexpr[] = [];

    for (const statement of list) {
      results = results.concat(this.parseStatement(statement));
    }

    return results;
  }
}