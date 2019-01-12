//预处理，提前替换掉输入里面的宏内容

const Input = require("./Input");

class PreProcess {
  constructor(macroHash) {
    this.macroHash = macroHash;
  }

  // 进行匹配替换
  process(inputString) {
    // 最多10次
    let max = 10;
    let content = inputString;
    // 尽量用循环代替递归
    while (true) {
      max--;
      const input = new Input();
      input.setInput(content);

      let token,
        targetPositionIndex = 0, // 记录转义符号的位置
        processString = content,
        processEnd = true; // 是否预处理结束
      // 如果下一个字符不是eof，那么继续
      while ((token = input.lookAhead(1)) !== Input.EOF) {
        input.advance(1);
        targetPositionIndex++;
        // 如果有转义符号
        if(token === "\\"){
          let macroWord = input.lookAhead(1); // 记录后一位的内容
          input.advance(1);
          let val = this.macroHash[macroWord];
          // 如果哈希表里面找得到宏对应的值，说明是个正常的宏
          if (val !== undefined) {
            processEnd = false; // 搜索完了必须进行下一轮的搜索,防止宏嵌套
            // 重新构造宏替换之后的字符串
            processString =
              processString.slice(0, targetPositionIndex - 1) +
              val +
              processString.slice(targetPositionIndex + macroWord.length);
            // 加上替换内容的长度
            targetPositionIndex += val.length - 1;
          }
        }
      }
      // 下一轮
      content = processString;
      // 如果没有可以结束了，或者已经达到了最大循环次数
      if (processEnd || max === 0) {
        break;
      }
    }

    console.log("宏替换后：" + content);
    return content;
  }
}

module.exports = PreProcess;

// let preProcess = new PreProcess(
//   `
//     D   [0-9]
//     A   [a-z]
//     AD  {A}|{D}
//   `
// );

// preProcess.process(`{AD}+{AD}+`);
