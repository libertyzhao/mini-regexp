//预处理，提前替换掉输入里面的宏内容

let Input = require("./Input");

class PreProcess {
  constructor(macroString) {
    this.macroInput = new Input();
    this.macroInput.setInput(macroString);
    this.macroHash = this.initMacro();
  }
  // 初始化宏哈希表
  initMacro() {
    let key,
      hash = {},
      value;
    while ((key = this.macroInput.lookAheadToken()) !== Input.EOF) {
      this.macroInput.advance(key.length);
      value = this.macroInput.lookAheadToken() || "";
      this.macroInput.advance(value.length);
      hash[key] = value;
    }
    return hash;
  }

  process(content) {
    // 最多10次
    let max = 10;
    // 尽量用循环代替递归
    while (true) {
      max--;
      let input = new Input();
      input.setInput(content);

      let token,
        leftBracketIndex = 0, // 记录左括号的位置
        processString = content,
        processEnd = true; // 是否预处理结束

      while ((token = input.lookAhead(1)) !== Input.EOF) {
        input.advance(1);
        leftBracketIndex++;
        // 如果有左括号
        if (token === "{") {
          let macroWord = ""; // 记录内容
          // 遍历括号里面的宏内容
          while ((token = input.lookAhead(1)) !== Input.EOF) {
            input.advance(1);
            if (token === "}") {
              break;
            }
            macroWord += token;
          }
          let val = this.macroHash[macroWord];
          // 如果是以右括号结尾，并且在哈希表里面找得到宏对应的值，说明是个正常的宏
          if (token === "}" && val !== undefined) {
            processEnd = false; // 只要有左右括号，那么这一轮搜索完了必须进行下一轮的搜索,防止宏嵌套
            // 重新构造宏替换之后的字符串
            processString =
              processString.slice(0, leftBracketIndex - 1) +
              val +
              processString.slice(leftBracketIndex + 1 + macroWord.length);
            // 加上替换内容的长度
            leftBracketIndex += val.length - 1;
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

    console.log('宏替换后：' + content);
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
