// 文本控制器，在这里获取文本的节点，希望能够方便的获取下一个单词或者其他的。

class Input {
  constructor() {
    this.startBuf = ""; // 数据载体
    this.pMark = 0; // 上一个单词的起始位置
    this.sMark = 0; // 当前单词的起始位置
    this.eMark = 0; // 当前单词的结束位置
    this.pSymbol = ""; // 上一个单词
    this.symbol = ""; // 当前单词

    this.lineNo = 1; // 当前单词所在的行号
    this.spaceSize = 0; // 空格长度
  }
  // 向前拿token
  getWord(i) {
    if (this.startBuf === "") {
      return Input.EOF;
    }
    let token = this.startBuf.slice(0, i);
    return token;
  }
  advance(i) {
    this.startBuf = this.startBuf.slice(i);
  }
  // 打标记
  mark(i) {
    this.pMark = this.sMark;
    this.sMark = this.eMark + this.spaceSize;
    this.eMark += i + this.spaceSize;
  }
  // 获取下一个字符
  lookAhead(i) {
    this.skipSpace();
    this.pSymbol = this.symbol;
    this.symbol = this.getWord(i);
    this.mark(i);
    return this.symbol;
  }
  // 直接获得下一个单词
  lookAheadToken() {
    this.skipSpace();
    return this.getNextToken();
  }
  // 跳过空格
  skipSpace() {
    let index = 0,
      spaceSize = 0,
      ignoreSpaceSize = false,
      character = this.startBuf[index];
    while (character === " " || character === "\n") {
      if (character === "\n") {
        this.lineNo++;
        this.sMark = 0; // 当前单词的起始位置
        this.eMark = 0; // 当前单词的结束位置
        spaceSize = 0;
      }
      index++;
      spaceSize++;
      character = this.startBuf[index];
    }

    this.spaceSize = spaceSize

    this.advance(index);
  }
  // 获取下一个单词
  getNextToken() {
    let index = 0,
      character = this.startBuf[index];
    while (
      character !== " " &&
      character !== "\n" &&
      index < this.startBuf.length
    ) {
      index++;
      character = this.startBuf[index];
    }
    return this.lookAhead(index);
  }
  // 获取单词信息
  getTokenInfo(type = 0) {
    switch (type) {
      case 0:
        return {
          symbol: this.symbol,
          row: this.lineNo,
          mark: this.sMark
        };
      case -1:
        return {
          symbol: this.pSymbol,
          row: this.pLineNo,
          mark: this.pMark
        };
      default:
        console.error("illegal type");
    }
  }
  clear() {
    this.pMark = 0; // 上一个单词的起始位置
    this.sMark = 0; // 当前单词的起始位置
    this.eMark = 0; // 当前单词的结束位置
    this.pSymbol = ""; // 上一个单词
    this.symbol = ""; // 当前单词

    this.lineNo = 1; // 当前单词所在的行号
    this.spaceSize = 0; // 空格长度
  }
  setInput(inputString) {
    this.clear();
    this.startBuf = inputString;
  }
}

Input.EOF = undefined;

module.exports = Input;

// let input = new Input();
// input.setInput(`i  am lizige`);
// console.log(input.lookAheadToken());
// console.log(input.lookAheadToken());
// console.log(input.lookAheadToken());
// console.log(input.lookAheadToken());
// console.log(input.lookAheadToken());
