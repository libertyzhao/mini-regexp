// 描述状态对象，具有自己的边，以及边上的属性

const ASCII_COUNT = 128;

class Nfa {
  constructor() {
    this.edge = Nfa.EPSILON; // 设定边的属性，ascii里面128个或者是EPSILON、CCL、EMPTY，默认是EPSILON
    this.next = undefined; // 跳转的下一个状态，可以是空
    this.next2 = undefined; // 跳转的另一个状态，当状态含有两条ε边时，这个指针才有效
    this.statusNumber = -1; // 状态编号
    this.visited = false; // 是否访问过，用来打印的时候调用
    this.inputSet = new Set([Nfa.EPSILON]); //  用来存储字符集，里面是ascii值,默认有个EPSILON
  }
  setVisited(){
      this.visited = true;
  }
  setEdge(type) {
    this.edge = type;
  }
  setStatusNumber(number) {
    this.statusNumber = number;
  }
  addSetAsciiCode(val){
    this.deleteEpsilon();
    this.inputSet.add(val);
  }
  addSet(val){
    this.deleteEpsilon();
    this.inputSet.add(val.charCodeAt());
  }
  deleteEpsilon(){
    this.inputSet.delete(Nfa.EPSILON);
  }
  // 将set里面的内容取反，比如本来有1,取反之后就是除了1以外的所有ascii的值
  reverseFill(){
    let set = new Set();
    for(let i = 0 ; i < ASCII_COUNT ; i++){
        if(this.inputSet.has(i)){
            continue;
        }
        set.add(i);
    }
    this.inputSet = set;
    this.deleteEpsilon();
  }
  clear() {
    this.edge = "";
    this.next = undefined;
    this.next2 = undefined;
    this.statusNumber = -1;
  }
}

Object.assign(Nfa, {
  EPSILON: -1, //边对应的是ε
  CCL: -2, //边对应的是字符集
  EMPTY: -3 //该节点没有出去的边
});

module.exports = Nfa;
