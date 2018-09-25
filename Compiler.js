let Lexer = require('./Lexer')
let Parser = require('./Parser')
let Input = require('./Input')
let PreProcess = require('./PreProcess')
let NfaMachine = require('./NfaMachine');

let preProcess = new PreProcess(`D   [0-9]`);
let input = new Input();
let lexer = new Lexer(input);
let parser = new Parser(lexer);
let nfaMachine = new NfaMachine(parser);

let regexp = `(a+)*s`;
console.log(`输入公式：${regexp}`);
input.setInput(preProcess.process(regexp));

let str = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaa`

nfaMachine.run();
let start = Date.now();
nfaMachine.test(str);
let end = Date.now();
console.log('dfa正则执行耗时:' + (end - start))

// 灾难性回溯
const reg = new RegExp(regexp);
start = Date.now();
let res = reg.test(str);
end = Date.now();
console.log(res ? '通过' : '不通过');
console.log('常规正则执行耗时:' + (end - start))
