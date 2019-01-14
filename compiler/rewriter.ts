import ts, { SyntaxKind, parseJsonSourceFileConfigFileContent, FunctionDeclaration, SyntaxList, ParameterDeclaration, Block, Statement, isSwitchStatement, ReturnStatement, Expression, BinaryExpression, Identifier, SuperExpression, SourceFile, NodeArray, ExpressionStatement, CallExpression, Token, LiteralExpression } from 'typescript';
import { sexprToString, Param, Sexpr, Sx, S } from './sexpr';
import { Program } from './program';

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
  constructor(
    private root   : ts.Node,
    private program: Program
  ) {
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
        ...this.parseStatementList(sf.statements),
      );

      return {
        name: "module",
        body: [
          { 
            name: "import", 
            body: [ '"js"', '"mem"', '(memory 1)'] 
          },
          ...this.parseStatementList(sf.statements)
        ],
      };
    }

    throw new Error('Unhandled base thing');
  }

  parseFunction(node: FunctionDeclaration): Sexpr[] {
    const functionName = node.name!.text;

    const params = this.parseParameterList(node.parameters)
    const sb = this.parseStatementList(node.body!.statements);

    return [
      Sx.Func({
        name: functionName,
        body: sb,
        params: params
      }),
      Sx.Export(functionName, "func")
    ];
  }

  parseExpression(expression: Expression): Sexpr {
    if (expression.kind === SyntaxKind.BinaryExpression) {
      const be = expression as BinaryExpression;
      const type = this.program.typeChecker.getTypeAtLocation(be.left);
      let fn: string | undefined;

      if (type.intrinsicName === "number") {
        const functionMapping: { [key in ts.BinaryOperator]: string | undefined } = {
          [ts.SyntaxKind.CommaToken                            ]: undefined,
          [ts.SyntaxKind.LessThanToken                         ]: undefined,
          [ts.SyntaxKind.GreaterThanToken                      ]: undefined,
          [ts.SyntaxKind.LessThanEqualsToken                   ]: undefined,
          [ts.SyntaxKind.GreaterThanEqualsToken                ]: undefined,
          [ts.SyntaxKind.EqualsEqualsToken                     ]: undefined,
          [ts.SyntaxKind.EqualsEqualsEqualsToken               ]: undefined,
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
        throw new Error("Dunno how to add that gg.");
      }

      if (fn === undefined) {
        throw new Error(`Unsupported binary operation: ${ ts.SyntaxKind[be.operatorToken.kind] }`);
      }

      // TODO: Mop up this intrinsic name stuff

      return {
        name: fn,
        body: [
          this.parseExpression(be.left),
          this.parseExpression(be.right),
        ],
      };
    }

    if (expression.kind === SyntaxKind.CallExpression) {
      const ce: CallExpression = expression;

      console.log(ce.expression.getText());

      if (ce.arguments.length !== 1) {
        throw new Error("unhandled log w/o 1 arg");
      }

      if (ce.expression.getText() === "console.log") {
        return S(
          "call",
          "$log",
          ...ce.arguments.map(x => this.parseExpression(x)),
        );
      } else {
        throw new Error(`Unhandled call expression ${ expression.getText() }`);
      }
    }

    if (expression.kind === SyntaxKind.Identifier) {
      const id = expression as Identifier;

      return Sx.GetLocal(id.escapedText);
    }

    if (expression.kind === SyntaxKind.FirstLiteralToken) {
      const t = expression as LiteralExpression;

      // TODO: Handle types

      return S("i32.const", t.getText());
    }

    console.log(expression.kind);

    throw new Error(`Unhandled expression! ${ ts.SyntaxKind[expression.kind] }`);
  }

  parseStatement(statement: Statement): Sexpr[] {
    if (statement.kind === ts.SyntaxKind.ExpressionStatement) {
      const es: ExpressionStatement = statement as ExpressionStatement;

      return [ this.parseExpression(es.expression) ];
    }

    if (statement.kind === ts.SyntaxKind.ReturnStatement) {
      const rs: ReturnStatement = statement as ReturnStatement;

      if (!rs.expression) {
        throw new Error("Unhandled");
      }

      return [ this.parseExpression(rs.expression) ];
    }

    switch (statement.kind) {
      case SyntaxKind.FunctionDeclaration:
        const fn = statement as FunctionDeclaration;
        const sexpr = this.parseFunction(fn);

        return sexpr;
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