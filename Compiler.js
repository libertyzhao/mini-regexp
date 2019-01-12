let Lexer = require('./Lexer')
let Parser = require('./Parser')
let Input = require('./Input')
let PreProcess = require('./PreProcess')
let NfaMachine = require('./NfaMachine');

// 配置宏 \d  ->  [0-9]
let preProcess = new PreProcess({d: '[0-9]'});
let input = new Input();
let lexer = new Lexer(input);
let parser = new Parser(lexer);
let nfaMachine = new NfaMachine(parser);

let regexp = `[A-Z]+\\d+(.*):(.*)+[A-Z]+\\d+`;
console.log(`输入公式：${regexp}`);
input.setInput(preProcess.process(regexp));

let str = `A1:B$1,C$1:D$1,E$1:F$1,G$1:H$1`

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
