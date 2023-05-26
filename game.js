const crypto = require('crypto');
const readline = require('readline');

class KeyGenerator {
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

class HmacGenerator {
  generateHmac(key, move) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(move);
    return hmac.digest('hex');
  }
}

class MoveRules {
  constructor(moves) {
    this.moves = moves;
  }

  determineWinner(userMove, computerMove) {
    const half = Math.floor((this.moves.length - 1) / 2);
    const index = this.moves.indexOf(userMove);
    const moveIndex = this.moves.indexOf(computerMove);

    if (userMove === computerMove) {
      return 'Draw';
    } else if (
      (moveIndex >= index + 1 && moveIndex <= index + half) ||
      (index + half >= this.moves.length && moveIndex <= (index + half) % this.moves.length)
    ) {
      return 'Computer wins!';
    } else {
      return 'You win!';
    }
  }
}

class HelpTableGenerator {
  constructor(moves) {
    this.moves = moves;
  }

  generateHelpTable(moves) {
    const table = [];
    const header = ['PC Moves', ...moves];
    table.push(header);

    for (let i = 0; i < moves.length; i++) {
      const row = [moves[i]];
      for (let j = 0; j < moves.length; j++) {
        const result = this.determineResult(moves[i], moves[j]);
        row.push(result);
      }
      table.push(row);
    }

    return table;
  }

  determineResult(move1, move2) {
    const half = (this.moves.length - 1) / 2;
    const index = this.moves.indexOf(move1);
    const moveIndex = this.moves.indexOf(move2);
    if (move1 === move2) {
      return 'Draw';
    } else if (
      (moveIndex >= index + 1 && moveIndex <= index + half) ||
      (index + half >= this.moves.length && moveIndex <= (index + half) % this.moves.length)
    ) {
      return 'Lose';
    } else {
      return 'Win';
    }
  }

  printTable(table) {
    const maxLengths = this.calculateColumnMaxLengths(table);

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      let rowStr = '|';

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const paddedCell = this.padCell(cell, maxLengths[j]);
        rowStr += ` ${paddedCell} |`;
      }

      console.log(rowStr);
    }
  }

  calculateColumnMaxLengths(table) {
    const maxLengths = [];

    for (let i = 0; i < table[0].length; i++) {
      let maxLength = 0;

      for (let j = 0; j < table.length; j++) {
        const cell = table[j][i];
        if (cell.length > maxLength) {
          maxLength = cell.length;
        }
      }

      maxLengths.push(maxLength);
    }

    return maxLengths;
  }

  padCell(cell, maxLength) {
    const paddingLength = maxLength - cell.length;
    const leftPadding = ' '.repeat(Math.floor(paddingLength / 2));
    const rightPadding = ' '.repeat(Math.ceil(paddingLength / 2));
    return `${leftPadding}${cell}${rightPadding}`;
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.keyGenerator = new KeyGenerator();
    this.hmacGenerator = new HmacGenerator();
    this.moveRules = new MoveRules(moves);
    this.helpTableGenerator = new HelpTableGenerator(moves);
    this.hmacKey = this.keyGenerator.generateKey();
    this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
  }

  generateHmac(move) {
    return this.hmacGenerator.generateHmac(this.hmacKey, move);
  }

  isMoveValid(move) {
    return this.moves.includes(move);
  }

  showMenu() {
    console.log(`HMAC: ${this.generateHmac(this.computerMove)}`);
    console.log('Available moves:');
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log('0 - exit');
    console.log('? - help');
  }

  printHelp() {
    console.log('Game Rules:');
    console.log('Each move beats the half of the moves coming after it in a circular manner.');
    console.log('To play the game, enter the number corresponding to your move.');
    console.log('Enter 0 to exit the game.');
    console.log('Enter ? to display the available moves and rules.');

    console.log('\nHelp table:');
    const helpTable = this.helpTableGenerator.generateHelpTable(this.moves);
    this.helpTableGenerator.printTable(helpTable);
  }

  play(userMove) {
    this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)]; // Генерация нового хода компьютера
    const hmac = this.generateHmac(this.computerMove);

    if (!this.isMoveValid(userMove)) {
      console.log('Invalid move. Please try again.\n');
      this.showMenu(hmac);
      return;
    }

    const result = this.moveRules.determineWinner(userMove, this.computerMove);

    console.log(`HMAC: ${hmac}`);
    console.log(`Your move: ${userMove}`);
    console.log(`Computer move: ${this.computerMove}`);
    console.log(result);
    console.log(`HMAC key: ${this.hmacKey}\n`);
    this.showMenu(hmac);
  }
}

const moves = process.argv.slice(2);
if (moves.length < 3 || moves.length % 2 !== 1 || new Set(moves).size !== moves.length) {
  console.log('Invalid moves. Please provide an odd number of unique moves.');
  console.log('Example: node game.js rock paper scissors');
} else {
  const game = new Game(moves);
  game.showMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function getUserMove() {
    rl.question('Enter your move: ', (answer) => {
      if (answer === '0') {
        rl.close();
        return;
      } else if (answer === '?') {
        game.printHelp();
      } else {
        const moveIndex = Number(answer) - 1;
        if (moveIndex >= 0 && moveIndex < moves.length) {
          game.play(moves[moveIndex]);
        } else {
          console.log('Invalid move. Please try again.\n');
          game.showMenu();
        }
      }

      getUserMove(); // Ask for the next move
    });
  }

  getUserMove();
}