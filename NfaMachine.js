// 控制器

let Nfa = require("./Nfa");
let Dfa = require("./Dfa");
let NfaPair = require("./NfaPair");
let Print = require("./Print");
let Input = require("./Input");
let fs = require("fs");

class NfaMachine {
  constructor(parser) {
    this.nfaCollection = new Set(); // NFA节点集合
    this.dfaCollection = new Map(); // DFA_ID:DFA 节点集合, 可以通过dfa的id来找到dfa节点
    this.input = new Input();
    this.nfaPair; // 记录整个图
    this.parser = parser;
    this.table = []; // 用二维数组画个有向图
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
    this.createTable();
    // this.processTable()
  }
  clear() {
    this.nfaCollection.clear();
  }
  // DFA最小化
  processTable(){
    let regionNumber = 1, newTable = [], indexTRegionNumber = {};
    for(let i = 0 ; i < this.table.length ; i++){
      let dfaInputList = this.table[i];

      if(dfaInputList.isEnd){
        dfaInputList.regionNumber = 1
        newTable[0] = newTable[0] || new Set();
        newTable[0].isEnd = true;
        newTable[0].add(i);
        indexTRegionNumber[i] = 0
      }else{
        dfaInputList.regionNumber = 0;
        newTable[1] = newTable[1] || new Set();
        newTable[1].add(i);
        indexTRegionNumber[i] = 1
      }
    }

    while(true){
      let size = newTable.length;
      for(let i = 0 ; i < this.table.length ; i++){
        let dfaInputList = this.table[i];
        for(let j = 0 ; j < dfaInputList.length ; j++){
          let nextIndex = dfaInputList[j];
          if(!nextIndex){continue}
          if(this.table[nextIndex].regionNumber !== dfaInputList.regionNumber && newTable[regionNumber].size > 1){
            dfaInputList.regionNumber = ++regionNumber;
            newTable[regionNumber] = newTable[regionNumber] || new Set();
            newTable[regionNumber].add(i);
            newTable[indexTRegionNumber[i]].delete(i);
          }
        }
      }
      if(size === newTable.length){
        break;
      }
    }
    console.log(newTable);

  }
  // 创建该正则的有向图
  createTable() {
    this.clear();
    this.nfaCollection.add(this.nfaPair.startNode);

    // 初始化第一波数据,也就是把起点沿着epsilon边展开
    let { newNfaCollection, newDfa } = this.getNewNfaSetAndDfa(this.nfaCollection),
      nfaToDfaMap = new Map();
    // 保存nfa集合和dfa节点的映射表
    nfaToDfaMap.set(newNfaCollection, newDfa);

    let stack = [];
    stack.push(nfaToDfaMap);

    for (let i = 0; i < stack.length; i++) {
      let map = stack[i];
      // console.log(stack);
      for (let [nfaSet, dfa] of map) {
        this.table[dfa.statusNumber] = this.table[dfa.statusNumber] || [];
        let newMap = this.nfaSetToDfa(nfaSet, dfa);
        if (newMap) {
          stack.push(newMap);
        }
      }
    }
    // 打印数组
    var str = ""
    this.table.forEach(item => {
      str += '[' + item.join(',') + '],' + '\n';
    })
    fs.writeFileSync("./table.js",`[${str}]`,'utf-8');
    // console.log(this.table);
  }
  // 把一个nfa集合转dfa
  nfaSetToDfa(nfaCollection, dfa) {
    let nfaToDfaMap;
    // 遍历nfa集合中的所有点的边
    for (let node of nfaCollection) {
      for (let key of node.inputSet) {
        // epsilon边被忽略
        if (
          this.table[dfa.statusNumber][key] === undefined &&
          key !== Nfa.EPSILON
        ) {
          // nfa集合中的节点，可以接受key值的输入，然后构成一个新的节点集合
          let nextNfaSet = this.move(nfaCollection, key);
          // 新的集合展开，也就是跑epsilon的边，然后转成一个dfa节点，并构建起nfa集合和dfa节点的对应的关系
          let { newNfaCollection, newDfa } = this.getNewNfaSetAndDfa(nextNfaSet);

          nfaToDfaMap = nfaToDfaMap || new Map();
          // 保存nfa集合和dfa节点的映射表
          nfaToDfaMap.set(newNfaCollection, newDfa);

          // 装进图中
          this.table[dfa.statusNumber][key] = newDfa.statusNumber;
          // 如果集合有终点，就给dfa节点设置一个终点
          if (nextNfaSet.has(this.nfaPair.endNode) && !newDfa.isEnd) {
            this.table[newDfa.statusNumber] = this.table[newDfa.statusNumber] || [];
            this.table[newDfa.statusNumber].isEnd = true;
            newDfa.setEnd();
          }
        }
      }
    }

    return nfaToDfaMap;
  }

  /**
   * （nfa转dfa，就是把nfa节点集合当做一个dfa节点）
   * 填充一个map，key是nfa的集合，value是dfa节点，
   */
  getNewNfaSetAndDfa(nfaCollection, nfaToDfaMap) {
    // 先把集合舒展开，也就是遍历开Epsilon边。
    let newNfaCollection = this.moveEpsilon(nfaCollection);
    // 拿到完整的集合之后，根据集合内nfa的编号，生成一个唯一的dfa节点id
    let nfaSetId = this.nfaSetToId(nfaCollection);
    // 通过这个dfa节点id去换一个dfa节点
    let newDfa = Dfa.getDfaWithNfaSetId(nfaSetId);
    // 在dfa节点集合中，保存节点编号和节点的映射关系
    this.dfaCollection.set(newDfa.statusNumber, newDfa);

    return { newNfaCollection, newDfa };
  }
  // nfa集合转成一个dfa的唯一id
  nfaSetToId(nfaSet) {
    let id = [];
    for (let node of nfaSet) {
      id.push(node.statusNumber);
    }
    id = id.sort().join(",");
    return id;
  }

  // 通过有向图测试字符串能否通过正则
  test(inputString) {
    console.log(`输入字符串：${inputString}`);

    this.input.setInput(inputString);

    let token,
      status = 0;

    while ((token = this.input.lookAhead(1)) !== Input.EOF) {
      this.input.advance(1);
      let code = token.charCodeAt();
      status = this.table[status][code];
    }
    let dfa = this.dfaCollection.get(status);
    if (dfa && dfa.isEnd) {
      console.log(`通过`);
    } else {
      console.log(`不通过`);
    }

    // this.clear();
    // this.nfaCollection.add(this.nfaPair.startNode);

    // let token;

    // while ((token = this.input.lookAhead(1)) !== Input.EOF) {
    //   this.input.advance(1);
    //   this.nfaCollection = this.moveEpsilon(this.nfaCollection);
    //   this.nfaCollection = this.move(this.nfaCollection, token.charCodeAt());
    // }
    // this.nfaCollection = this.moveEpsilon(this.nfaCollection);

    // if (this.nfaCollection.has(this.nfaPair.endNode)) {
    //   console.log(`通过`);
    // } else {
    //   console.log(`不通过`);
    // }
  }
  // Epsilon边的移动
  moveEpsilon(nfaCollection) {
    let done = false,
      length;
    while (!done) {
      let newNfaCollect = this.move(nfaCollection, Nfa.EPSILON);
      length = nfaCollection.size;
      // 循环直到NfaCollection的长度不发生变化的时候才结束
      for (let node of newNfaCollect) {
        nfaCollection.add(node);
      }
      done = length === nfaCollection.size;
    }
    return nfaCollection;
  }
  // 移动 ，给一个数值，比对它和节点的边的值，相同则证明可以移动
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
