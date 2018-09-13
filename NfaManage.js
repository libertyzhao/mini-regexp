// 状态节点管理器，类似于连接池的概念，所有状态节点的产生都是从管理器里面获取，就是一个状态节点的池子

let Nfa = require("./Nfa");

class NfaManage {
  constructor() {
    this.maxSize = 20; // 初始创建20个结点
    this.addSize = 5; // 以后每次不够，就增加5个
    this.statusNumber = 1; // 状态编号
    this.pool = [];
    this.add(this.maxSize);
  }
  add(size) {
    for (let i = 0; i < size; i++) {
      let nfa = new Nfa();
      this.pool.push(nfa);
    }
  }
  getNfa() {
    let nfa;
    if (this.pool.length <= 0) {
      this.add(this.addSize);
    }
    nfa = this.pool.pop();
    nfa.setStatusNumber(this.statusNumber++);
    return nfa;
  }
  discardNfa(nfa) {
    nfa.clear(); // 归还的nfa需要清理一下
    this.pool.push(nfa);
  }
}

module.exports = NfaManage;
