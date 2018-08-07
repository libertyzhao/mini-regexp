// 状态机，里面是简单的正则匹配，复杂的正则匹配其实也是简单的正则匹配合起来的

let NfaManage = require("./NfaManage");
let Nfa = require("./Nfa");
let Lexer = require("./Lexer");
let NfaPair = require("./NfaPair");
let Print = require("./Print");
let Input = require("./Input");

class NfaMachine {
  constructor(lexer) {
    this.NfaManage = new NfaManage();
    this.lexer = lexer;
    this.nfaCollection = new Set();
    this.input = new Input();
    this.nfaPair; // 记录整个图
  }
  // 构造图
  run() {
    let nfaPair = new NfaPair();
    // this.term(nfaPair);
    this.expr(nfaPair);
    this.nfaPair = nfaPair;
    console.log(`起点：${nfaPair.startNode.statusNumber}`)
    console.log(`终点：${nfaPair.endNode.statusNumber}`)
    Print.printNfa(nfaPair.startNode);
  }
  clear() {
    this.nfaCollection.clear();
  }
  // 测试字符串能否通过正则
  test(inputString) {
    this.clear();
    this.nfaCollection.add(this.nfaPair.startNode);

    this.input.setInput(inputString);

    let token;

    while ((token = this.input.lookAhead(1)) !== Input.EOF) {
      this.input.advance(1);
      this.moveEpsilon();
      this.nfaCollection = this.move(this.nfaCollection, token.charCodeAt());
    }
    this.moveEpsilon();

    if (this.nfaCollection.has(this.nfaPair.endNode)) {
      console.log(`通过`);
    } else {
      console.log(`不通过`);
    }
  }
  moveEpsilon() {
    let done = false, length;
    while (!done) {
      let newNfaCollect = this.move(this.nfaCollection, Nfa.EPSILON);
      length = this.nfaCollection.size;
      // 循环直到NfaCollection不发生变化的时候才结束
      for(let node of newNfaCollect){
        this.nfaCollection.add(node);
      }
      done = length === this.nfaCollection.size;
    }
  }
  // 移动
  move(nfaCollect, input) {
    let newNfaCollect = new Set();
    for (let node of nfaCollect) {
      if (node.inputSet.has(input) && node.next) {
        newNfaCollect.add(node.next);
        if (node.next2) {
          newNfaCollect.add(node.next2);
        }
      }
    }
    return newNfaCollect;
  }
  // 或操作 |
  expr(nfaPair) {
    /*
     * expr 由一个或多个cat_expr 之间进行 OR 形成
     * 如果表达式只有一个cat_expr 那么expr 就等价于cat_expr
     * 如果表达式由多个cat_expr做或连接构成那么 expr-> cat_expr | cat_expr | ....
     * expr -> expr | cat_expr
     *      -> cat_expr
     */
    let start, end;
    let orNfaPair = new NfaPair();
    this.cat_expr(nfaPair);
    while (this.lexer.match(Lexer.OR)) {
      this.lexer.advance();
      this.cat_expr(orNfaPair);

      start = this.NfaManage.getNfa();
      end = this.NfaManage.getNfa();

      start.next = nfaPair.startNode;
      nfaPair.endNode.next = end;

      start.next2 = orNfaPair.startNode;
      orNfaPair.endNode.next = end;
    }
    start && (nfaPair.startNode = start);
    end && (nfaPair.endNode = end);
    return true;
  }
  // b . [a-z]三种的抽象描述
  term(nfaPair) {
    // 在每次进行匹配的时候，先看看后面是不是括号
    let bool = this.exprParentheses(nfaPair);
    // 先看是不是单字符 b
    if (!bool) {
      bool = this.nfaForSingleCharacter(nfaPair);
    }
    // 再看是不是特殊字符点 .
    if (!bool) {
      bool = this.nfaForDot(nfaPair);
    }
    // 再看是不是字符集 []
    if (!bool) {
      this.nfaForCharacterSet(nfaPair);
    }
  }
  // * + ?三种闭包的抽象描述
  factor(nfaPair) {
    this.term(nfaPair);

    let closureType; // 1 -> * , 2 -> + , 3 -> ?
    if (this.lexer.match(Lexer.CLOSURE)) {
      closureType = 1;
    } else if (this.lexer.match(Lexer.PLUS_CLOSE)) {
      closureType = 2;
    } else if (this.lexer.match(Lexer.OPTIONAL)) {
      closureType = 3;
    } else {
      return false;
    }
    this.nfaClosure(nfaPair, closureType);
  }
  // 连接factor,比如连接[a-z]+[A-Z]?
  cat_expr(nfaPair) {
    /**
     *  cat_expr -> factor factor .....
     *  多个factor 前后结合就是一个cat_expr
     *  cat_expr-> factor cat_expr
     */
    let start, end;

    while (
      !this.lexer.match(Lexer.EOF) &&
      this.checkError(this.lexer.nextWordType)
    ) {
      this.factor(nfaPair);
      if (!start) {
        start = nfaPair.startNode;
      } else {
        end.next = nfaPair.startNode;
      }
      end = nfaPair.endNode;
    }
    nfaPair.startNode = start;
    nfaPair.endNode = end;
    return true;
  }
  exprParentheses(nfaPair) {
    if (this.lexer.match(Lexer.OPEN_PAREN)) {
      this.lexer.advance();
      this.expr(nfaPair);
      if (this.lexer.match(Lexer.CLOSE_PAREN)) {
        this.lexer.advance();
      } else {
        throw Error(`expected ), but got this.lexer.symbol`);
      }
      return true;
    }
    return false;
  }
  // 匹配单个字符，b
  nfaForSingleCharacter(nfaPair) {
      let transformStatus = false;
    if (this.lexer.match(Lexer.TRANSFORM)) {
        this.lexer.advance();
        // transform之后的状态，无视literal
        transformStatus = true;
    }
    if (!transformStatus && !this.lexer.match(Lexer.LITERAL)) {
      return false;
    }
    nfaPair.startNode = this.NfaManage.getNfa();
    nfaPair.startNode.next = nfaPair.endNode = this.NfaManage.getNfa();

    nfaPair.startNode.setEdge(Nfa.CCL);
    nfaPair.startNode.addSet(this.lexer.symbol);

    this.lexer.advance();
    return true;
  }
  // 匹配任意字符 .
  nfaForDot(nfaPair) {
    if (!this.lexer.match(Lexer.ANY)) {
      return false;
    }
    nfaPair.startNode = this.NfaManage.getNfa();
    nfaPair.startNode.next = nfaPair.endNode = this.NfaManage.getNfa();

    nfaPair.startNode.setEdge(Nfa.CCL);

    nfaPair.startNode.addSet("\n");
    nfaPair.startNode.addSet("\r");
    nfaPair.startNode.reverseFill(); // 取反，不能有\n和\r

    this.lexer.advance();
    return true;
  }

  // 匹配非字符集 [a-zA-Z] [^a-zA-Z]
  nfaForCharacterSet(nfaPair) {
    if (!this.lexer.match(Lexer.CCL_START)) {
      return false;
    }
    this.lexer.advance();
    let atBolStatus = true;
    // 后面如果不是跟着^
    if (!this.lexer.match(Lexer.AT_BOL)) {
      atBolStatus = false;
    }
    nfaPair.startNode = this.NfaManage.getNfa();
    nfaPair.startNode.next = nfaPair.endNode = this.NfaManage.getNfa();

    nfaPair.startNode.setEdge(Nfa.CCL);
    if (!this.lexer.match(Lexer.CCL_END)) {
      this.doConnect(nfaPair.startNode);
    }
    // 最后跳出来，要么是],要么是字符串结尾，不是结尾才能前进
    if (!this.lexer.match(Lexer.EOF)) {
      this.lexer.advance();
    }
    // 如果含有符号^，则需要取反
    if (atBolStatus) {
      nfaPair.startNode.reverseFill();
    }
    return true;
  }
  // a-z  连接
  doConnect(node) {
    let start = 0,
      end = 0;
    while (!this.lexer.match(Lexer.CCL_END) && !this.lexer.match(Lexer.EOF)) {
      start = this.lexer.symbol.charCodeAt();
      this.lexer.advance();
      // 匹配到了连接符
      if (this.lexer.match(Lexer.CONNECT)) {
        this.lexer.advance();
        // 只要后面不是结束,就把ascii集合放到set中
        if (!this.lexer.match(Lexer.EOF)) {
          end = this.lexer.symbol.charCodeAt();
          this.lexer.advance();
          for (let i = start; i <= end; i++) {
            node.addSetAsciiCode(i);
          }
        }
      } else {
        // 后面不是连接符，就是单个字符直接的连接
        node.addSetAsciiCode(start);
      }
    }
  }
  // 闭包 [a-z]*  [a-z]+  [a-z]?
  nfaClosure(nfaPair, closureType) {
    let start = this.NfaManage.getNfa(),
      end = this.NfaManage.getNfa();

    start.next = nfaPair.startNode;
    // + 无下面这句
    if (closureType != 2) {
      start.next2 = end;
    }
    // ? 无下面这句
    if (closureType != 3) {
      nfaPair.endNode.next2 = nfaPair.startNode;
    }

    nfaPair.endNode.next = end;

    // 图画完了，让nfaPair保留刚刚整个图的信息
    nfaPair.startNode = start;
    nfaPair.endNode = end;

    this.lexer.advance();
    return true;
  }
  // 如果碰到一个nfaClosure是用一个错误的开头，就可以直接确定正则错误了
  checkError(token) {
    switch (token) {
      case Lexer.CLOSE_PAREN:
      case Lexer.AT_EOL:
      case Lexer.OR:
      case Lexer.EOF:
        return false;
      case Lexer.CLOSURE:
      case Lexer.PLUS_CLOSE:
      case Lexer.OPTIONAL:
      case Lexer.CCL_END:
        throw Error(`不应该以${this.lexer.symbol}开头`);
    }
    return true;
  }
}

module.exports = NfaMachine;
