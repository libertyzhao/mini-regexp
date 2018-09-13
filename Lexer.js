const ASCII_COUNT = 128;
let Input = require("./Input");

class Lexer {
  constructor(input) {
    this.tokenMap = new Array(ASCII_COUNT);
    this.input = input;
    this.nextWordType = -1; // 后面一个字符的类型
    this.step = 1; // 前看几步
    this.initTokenMap();
  }
  initTokenMap() {
    // 除了下面的特殊符号，其他都是LITERAL，暂时先不换成ascii值
    this.tokenMap["."] = Lexer.ANY;
    this.tokenMap["^"] = Lexer.AT_BOL;
    this.tokenMap["$"] = Lexer.AT_EOL;
    this.tokenMap["]"] = Lexer.CCL_END;
    this.tokenMap["["] = Lexer.CCL_START;
    this.tokenMap[")"] = Lexer.CLOSE_PAREN;
    this.tokenMap["*"] = Lexer.CLOSURE;
    this.tokenMap["-"] = Lexer.CONNECT;
    this.tokenMap["("] = Lexer.OPEN_PAREN;
    this.tokenMap["?"] = Lexer.OPTIONAL;
    this.tokenMap["|"] = Lexer.OR;
    this.tokenMap["+"] = Lexer.PLUS_CLOSE;
  }
  get symbol() {
    return this.input.symbol;
  }
  lex() {
    let token = this.input.lookAhead(this.step);
    if (token === Lexer.EOF) {
      return Lexer.EOF;
    }
    if (token === "\\") {
      // 进了转义的，所有token应该都在ascii里面
      token = this.handleTransform();
      this.nextWordType = Lexer.TRANSFORM;
      return this.nextWordType;
    }

    this.nextWordType = this.tokenMap[token];
    return this.nextWordType || Lexer.LITERAL;
  }
  handleTransform() {
    let token = this.input.lookAhead(2);

    switch (token) {
      case "\\b":
        token = "\b";
      case "\\d":
        token = "\d";
      case "\\f":
        token = "\f";
      case "\\n":
        token = "\n";
      case "\\r":
        token = "\r";
      case "\\s":
        token = "\s";
      case "\\w":
        token = "\w";
      default :
        token = token.slice(1);
    }
    return token.charCodeAt();
  }
  match(token) {
    if (this.nextWordType === -1) {
      this.nextWordType = this.lex();
    }
    return token == this.nextWordType;
  }
  // 前看符号持续推进，下次match的时候，肯定是看后面的一个符号是不是自己想要的
  advance() {
    this.input.advance(this.step);
    this.nextWordType = this.lex();
  }
}

Object.assign(Lexer, {
  ANY: "ANY", // . 通配符
  AT_BOL: "AT_BOL", //^ 开头匹配符
  AT_EOL: "AT_EOL", //$ 末尾匹配符
  CCL_END: "CCL_END", //字符集类结尾括号 ]
  CCL_START: "CCL_START", //字符集类开始括号 [
  CLOSE_PAREN: "CLOSE_PAREN", //)
  CLOSURE: "CLOSURE", //*
  CONNECT: "CONNECT", // -
  LITERAL: "LITERAL", //字符常量
  OPEN_PAREN: "OPEN_PAREN", // (
  OPTIONAL: "OPTIONAL", //?
  OR: "OR", // |
  PLUS_CLOSE: "PLUS_CLOSE", // +
  TRANSFORM: "TRANSFORM", // \
  EOF: Input.EOF // 输入流结尾
});

module.exports = Lexer;
