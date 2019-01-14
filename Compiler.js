const Lexer = require('./Lexer')
const Parser = require('./Parser')
const Input = require('./Input')
const PreProcess = require('./PreProcess')
const NfaMachine = require('./NfaMachine');

// 配置宏 \d  ->  [0-9]
const preProcess = new PreProcess({d: '[0-9]'});
const input = new Input();
const lexer = new Lexer(input);
const parser = new Parser(lexer);
const nfaMachine = new NfaMachine(parser);

const regexp = `[A-Z]+\\d+(.*):(.*)+[A-Z]+\\d+`;
console.log(`输入公式：${regexp}`);
input.setInput(preProcess.process(regexp));

const str = `A1:B$1,C$1:D$1,E$1:F$1,G$1:H$1`

nfaMachine.run();
let start = Date.now();
nfaMachine.test(str);
let end = Date.now();
console.log('dfa正则执行耗时:' + (end - start))

// 灾难性回溯
const reg = new RegExp(regexp);
start = Date.now();
const res = reg.test(str);
end = Date.now();
console.log(res ? '通过' : '不通过');
console.log('常规正则执行耗时:' + (end - start))
