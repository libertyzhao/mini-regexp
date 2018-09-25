// 把nfaPair构成的图，通过子集构造法转dfa，然后在用dfa最小化算法压缩。

const Nfa = require("./Nfa");
const Dfa = require("./Dfa");

class TableProcess {
  constructor() {
    this.nfaPair; // 记录整个图
    this.nfaCollection = new Set(); // NFA节点集合
    this.dfaCollection = new Map(); // DFA_ID:DFA 节点集合, 可以通过dfa的id来找到dfa节点
    this.table = []; // 用二维数组画个有向图
  }
  // DFA最小化
  // 就是将dfa数组再分区,先将终点节点看做区域1，非终点节点看做区域0，
  // 区域0里面的节点接收到字符，如果变成了非本区域的节点，比如从区域0变成区域1的节点，那么给这个节点划个新区域定为区域3，依次类推
  // 直到发现所有区域都最小不可分为止（即一个区域必须最少要有一个节点）
  // 这里是生成newTable，该table里面存放的是每个区域里面含有的dfa节点的下标，然后通过transformTable，把newTable转成有向图
  processTable() {
    let regionNumber = 1; //规定区域0里面是非终结节点，区域1里面是终结节点，所以这里从1开始，下面会++
    // 获取到新的分区表，和节点跟分区id映射的hash表
    let { newTable, dfaToRegion } = this.initNewTable();

    // 拆分 newTable
    // 区域A里面的节点接收字符后，如果变成了非本区域的节点，比如从区域0变成区域1的节点，那么给这个节点划个新区域定为区域3，依次类推
    function breakUpRegionTable(dfaInputList, i) {
      // 将该节点从之前区域删除
      newTable[dfaInputList.regionNumber].delete(i);
      ++regionNumber; // 增加区域编号
      newTable[regionNumber] = newTable[regionNumber] || new Set(); // 创建新的区域
      newTable[regionNumber].add(i);
      // 如果该节点是结束节点，则也要给该区域标明是结束区域
      if (newTable[dfaInputList.regionNumber].isEnd) {
        newTable[regionNumber].isEnd = true;
      }
      // 将该节点的编号，和区域编号映射起来
      dfaToRegion[i] = regionNumber;
      dfaInputList.regionNumber = regionNumber; // 更新该节点所属的区域信息
    }

    // 不断的分区，当无法分出新的区域，则完成
    while (true) {
      const size = newTable.length;
      for (let i = 0; i < this.table.length; i++) {
        let dfaInputList = this.table[i]; // 获取节点的输入集合
        if (dfaInputList.length > 0) {
          for (let j = 0; j < dfaInputList.length; j++) {
            // 获取当前节点i，输入j以后，跳转到的下个节点
            let nextState = dfaInputList[j];
            if (!nextState) {
              continue;
            }
            // 如果点A输入j以后，变成点B，点B如果和点A属于不同的区域，  并且，  点A区域任然可以划分（点A所在区域中的不止点A一个点）
            if (
              this.table[nextState].regionNumber !==
                dfaInputList.regionNumber &&
              newTable[dfaInputList.regionNumber].size > 1
            ) {
              // 拆分新的区域
              breakUpRegionTable(dfaInputList, i);
            }
          }
        } else if (newTable[dfaInputList.regionNumber].size > 1) {
          // 存在情况是该节点本来就是死节点，也就是不接受任何输入的情况,这种的终结节点和其他仍然可以输入的终结节点不一样
          breakUpRegionTable(dfaInputList, i);
        }
      }
      // 知道最后没有新区域产生，说明划分完毕，就结束
      if (size === newTable.length) {
        break;
      }
    }
    console.log(newTable);
    // 将分区表转换成区域的有向图
    this.table = this.transformTable(newTable, dfaToRegion)
    return this.table;
  }

  // 初始化第一波newTable的数据，也就是把当前的dfa的有向图再分区,先将终点节点看做区域1，非终点节点看做区域0，
  initNewTable() {
    let newTable = [], // 该table里面存放的是每个区域里面含有的dfa节点的下标
      dfaToRegion = {}; // 每个dfa节点，对应在哪个区域中(newTable的下标),方便快速查找

    for (let i = 0; i < this.table.length; i++) {
      // 该节点的输入集合
      let dfaInputList = this.table[i];
      // 如果是终点节点，就划分区域1
      if (dfaInputList.isEnd) {
        dfaInputList.regionNumber = 1;
        newTable[1] = newTable[1] || new Set();
        newTable[1].isEnd = true;
        newTable[1].add(i);// 下标即为dfa节点编号
        dfaToRegion[i] = 1;
      } else {
        // 非终点节点，就划分区域0
        dfaInputList.regionNumber = 0;
        newTable[0] = newTable[0] || new Set();
        newTable[0].add(i);
        dfaToRegion[i] = 0;
      }
    }
    return { newTable, dfaToRegion };
  }

  // 将分区表转换成区域的有向图
  transformTable(newTable, dfaToRegion) {
    let regionTable = [];
    for (let i = 0; i < newTable.length; i++) {
      // 将这个分区表中的所有dfa节点编号拿出
      let tableNumberSet = newTable[i];
      for (let tableNumber of tableNumberSet) {
        // 获得该dfa节点的输入集合，每一个输入对应的值是下一个dfa节点的编号
        let inputToNextTableNumber = this.table[tableNumber];
        if (inputToNextTableNumber.length > 0) {
          // 遍历这个输入集合
          inputToNextTableNumber.forEach((nextTableNumber, input) => {
            // 将下一个dfa编号去dfaToRegion找到它对应的区域编号
            let regionNumber = dfaToRegion[nextTableNumber];
            regionTable[i] = regionTable[i] || [];
            // 那么也就是说该区域在收到input字符之后，会跳转到下一个区域
            regionTable[i][input] = regionNumber;
          });
        } else {
          regionTable[i] = regionTable[i] || [];
        }
        // 标记区域终点
        newTable[i].isEnd && (regionTable[i].isEnd = true);
      }
    }

    return regionTable;
  }
  clear() {
    this.nfaCollection.clear();
  }
  // 创建该正则的有向图，子集构造法，将每个集合(节点a展开ℇ边之后的节点集合)看做一个节点，将该集合输入字符a后，跳转到的集合b(展开ℇ边之后的集合)，作为一个新的节点
  createTable(nfaPair) {
    this.nfaPair = nfaPair;
    this.clear();
    // 将起始节点加入nfa集合中
    this.nfaCollection.add(this.nfaPair.startNode);

    // 初始化第一波数据,也就是把起点沿着epsilon边展开,然后得到新的集合，和该集合对应的dfa节点
    let { newNfaCollection, newDfa } = this.getNewNfaSetAndDfaByNfaSet(
        this.nfaCollection
      ),
      nfaToDfaMap = new Map();
    // 保存nfa集合和dfa节点的映射表
    nfaToDfaMap.set(newNfaCollection, newDfa);

    // 不断的去遍历，拿到新的映射表放入栈中
    let stack = [];
    stack.push(nfaToDfaMap);

    for (let i = 0; i < stack.length; i++) {
      let map = stack[i];
      for (let [nfaSet, dfa] of map) {
        this.table[dfa.statusNumber] = this.table[dfa.statusNumber] || [];
        // 遍历该集合所有的边，找到新的集合，并把新集合和dfa节点的映射关系保存下来
        let newMap = this.getDfaMapByNfaSet(nfaSet, dfa);
        if (newMap) {
          stack.push(newMap);
        }
      }
    }
    return this.table;
  }
  // 把一个nfa集合展开，也就是遍历该nfa集合里面的所有的输入，把产生的新的集合nextNfaSet，去构造一个新的dfa节点，然后塞进map中
  getDfaMapByNfaSet(nfaCollection, dfa) {
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
          let { newNfaCollection, newDfa } = this.getNewNfaSetAndDfaByNfaSet(
            nextNfaSet
          );

          nfaToDfaMap = nfaToDfaMap || new Map();
          // 保存nfa集合和dfa节点的映射表
          nfaToDfaMap.set(newNfaCollection, newDfa);

          // 装进图中
          this.table[dfa.statusNumber][key] = newDfa.statusNumber;
          // 如果集合有终点，就给dfa节点设置一个终点
          if (nextNfaSet.has(this.nfaPair.endNode) && !newDfa.isEnd) {
            this.table[newDfa.statusNumber] =
              this.table[newDfa.statusNumber] || [];
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
  getNewNfaSetAndDfaByNfaSet(nfaCollection) {
    // 先把集合舒展开，也就是遍历开Epsilon边。
    let newNfaCollection = this.moveEpsilon(nfaCollection);
    // 拿到完整的集合之后，根据集合内nfa的编号，生成一个唯一的dfa节点id
    let nfaSetId = this.nfaSetToId(newNfaCollection);
    // 通过这个dfa节点id去换一个dfa节点
    let newDfa = Dfa.getDfaWithNfaSetId(nfaSetId);
    // 在dfa节点集合中，保存节点编号和节点的映射关系
    this.dfaCollection.set(newDfa.statusNumber, newDfa);

    return { newNfaCollection, newDfa };
  }
  // nfa集合转成一个dfa的唯一id，主要是用这个唯一id去换一个dfa节点
  nfaSetToId(nfaSet) {
    let id = [];
    for (let node of nfaSet) {
      id.push(node.statusNumber);
    }
    id = id.sort().join(",");
    return id;
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

module.exports = TableProcess;
