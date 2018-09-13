let STATUS_NUMBER = 0; // 编号
let DfaSet = {} // 记录NfaSetId对应的Dfa节点

class Dfa{
  constructor(nfaSetId){
    this.statusNumber = STATUS_NUMBER++;
    this.isVisited = false;
    this.nfaSetId = nfaSetId;
    this.isEnd = false;
  }
  // 设置该节点为终点
  setEnd(){
    this.isEnd = true;
  }
  static getDfaWithNfaSetId(id){

    if(!DfaSet[id]){
      DfaSet[id] = new Dfa(id);
    }else{
      DfaSet[id].isVisited = true;
    }

    return DfaSet[id]
  }
}

module.exports = Dfa;
