// 控制器

let NfaPair = require("./NfaPair");
let Print = require("./Print");
let Input = require("./Input");
let TableProcess = require('./TableProcess');
let fs = require("fs");

class NfaMachine {
  constructor(parser) {
    this.input = new Input();
    this.parser = parser;
    this.table = []; // 用二维数组画个有向图
    this.tableProcess = new TableProcess();
  }
  // 构造图
  run() {
    let nfaPair = new NfaPair();
    // this.term(nfaPair);
    // 汤姆森构造法
    this.parser.expr(nfaPair);
    this.nfaPair = nfaPair;
    // console.log(`起点：${nfaPair.startNode.statusNumber}`)
    // console.log(`终点：${nfaPair.endNode.statusNumber}`)
    // Print.printNfa(nfaPair.startNode);

    // 子集构造法，构造dfa
    this.tableProcess.createTable(nfaPair);
    // dfa最小化
    this.table = this.tableProcess.processTable();
    // 打印数组
    var str = ""
    this.table.forEach(item => {
      str += '[' + item.join(',') + '],' + '\n';
    })
    fs.writeFileSync("./Dfa-Map.js",`[${str}]`,'utf-8');
  }

  // 通过有向图测试字符串能否通过正则
  test(inputString) {
    console.log(`输入字符串：${inputString}`);

    this.input.setInput(inputString);

    let token,
      status = 0;

    try{
      while ((token = this.input.lookAhead(1)) !== Input.EOF) {
        this.input.advance(1);
        let code = token.charCodeAt();
        status = this.table[status][code];
      }
      if (this.table[status].isEnd) {
        console.log(`通过`);
      } else {
        console.log(`不通过`);
      }
    }catch(e){
      console.log('不通过');
    }
  }

}

module.exports = NfaMachine;
