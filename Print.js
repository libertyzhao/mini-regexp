// 打印节点
let Nfa = require("./Nfa");

const Print = {
  printNfa(node) {
    if (!node || node.visited) {
      return;
    }

    node.setVisited();
    this.printNfaNode(node);

    this.printNfa(node.next);
    this.printNfa(node.next2);
  },
  printNfaNode(node) {
    if (!node.next) {
      return;
    }
    console.log(`${node.statusNumber} ----> ${node.next.statusNumber}`);
    if (node.next2) {
      console.log(`${node.statusNumber} ----> ${node.next2.statusNumber}`);
    }
    switch (node.edge) {
      case Nfa.EPSILON:
        console.log("EPSILON");
        break;
      case Nfa.CCL:
        this.printCCL(node);
        break;
      default:
        console.log(node.edge);
        break;
    }
  },
  printCCL(node) {
    let str = "";
    node.inputSet.forEach(val => {
      str += String.fromCharCode(val);
    });
    console.log(str)
  }
};

module.exports = Print;
