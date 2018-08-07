let Lexer = require('./Lexer')
let Input = require('./Input')
let PreProcess = require('./PreProcess')
let NfaMachine = require('./NfaMachine');

let preProcess = new PreProcess(`D   [0-9]`);
let input = new Input();
let lexer = new Lexer(input);
let nfaMachine = new NfaMachine(lexer);

let inputString = `[0-9]\\.[a-z]+`;
console.log(`输入公式：${inputString}`);
input.setInput(preProcess.process(inputString));

nfaMachine.run();
nfaMachine.test(`1.abcd`);
