// 控制器

let Nfa = require("./Nfa");
let NfaPair = require("./NfaPair");
let Print = require("./Print");
let Input = require("./Input");

class NfaMachine {
  constructor(parser) {
    this.nfaCollection = new Set();
    this.input = new Input();
    this.nfaPair; // 记录整个图
    this.parser = parser;
  }
  // 构造图
  run() {
    let nfaPair = new NfaPair();
    // this.term(nfaPair);
    this.parser.expr(nfaPair);
    this.nfaPair = nfaPair;
    // console.log(`起点：${nfaPair.startNode.statusNumber}`)
    // console.log(`终点：${nfaPair.endNode.statusNumber}`)
    // Print.printNfa(nfaPair.startNode);
  }
  clear() {
    this.nfaCollection.clear();
  }
  NfaToDfa(){

  }
  // 测试字符串能否通过正则
  test(inputString) {
    console.log(`输入字符串：${inputString}`)
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

}

module.exports = NfaMachine;
