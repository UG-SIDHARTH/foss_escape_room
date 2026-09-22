const levels = [
  {
    level: 1,
    name: 'The GitHub Vault',
    variants: [
      {
        id: 0,
        text: 'The door is closed. What is the opposite?',
        key_reward: 'OPEN',
        hint: 'Think about the state of a door. If it is not closed, it must be...',
        validate: (answer) => answer.trim().toLowerCase() === 'open'
      },
      {
        id: 1,
        text: 'A git command to send your commits to the remote. What is its opposite to fetch and integrate?',
        key_reward: 'PULL',
        hint: 'You push to send, you do this to receive.',
        validate: (answer) => answer.trim().toLowerCase() === 'pull'
      },
      {
        id: 2,
        text: 'In boolean logic, what is the opposite of true?',
        key_reward: 'FALSE',
        hint: 'If a statement is not correct, it is...',
        validate: (answer) => answer.trim().toLowerCase() === 'false'
      }
    ]
  },
  {
    level: 2,
    name: 'The Linux Terminal',
    variants: [
      {
        id: 0,
        text: '$ whoami\nroot\n$ cat .hidden_key\nThe bird is the word. And the answer to life, the universe, and everything. (No spaces)',
        key_reward: 'PENGUIN42',
        hint: 'The mascot of Linux is a penguin. What is the answer to the ultimate question of life, the universe, and everything?',
        validate: (answer) => answer.trim().toLowerCase() === 'penguin42'
      },
      {
        id: 1,
        text: '$ ls -la\n-rw-r--r-- 1 linus linus 42 May 1 1991 creator.txt\nWhat is the first name of the creator?',
        key_reward: 'LINUS',
        hint: 'Look at the owner of the file.',
        validate: (answer) => answer.trim().toLowerCase() === 'linus'
      },
      {
        id: 2,
        text: '$ sudo make me a sandwich\nWhat does "sudo" stand for? (Two words, no spaces)',
        key_reward: 'SUPERUSERDO',
        hint: 'It allows a permitted user to execute a command as the superuser. S_ U_ DO.',
        validate: (answer) => answer.trim().toLowerCase() === 'superuserdo'
      }
    ]
  },
  {
    level: 3,
    name: 'The Password Lock',
    variants: [
      {
        id: 0,
        text: 'A strange message was intercepted. It is a Caesar cipher shifted forward by 3: "KHOOR"',
        key_reward: 'HELLO',
        hint: 'Move each letter backwards in the alphabet by 3 spaces. K -> H...',
        validate: (answer) => answer.trim().toLowerCase() === 'hello'
      },
      {
        id: 1,
        text: 'A strange message was intercepted. It is a Caesar cipher shifted backward by 1: "SFTU"',
        key_reward: 'TEST',
        hint: 'Move each letter forwards in the alphabet by 1 space. S -> T...',
        validate: (answer) => answer.trim().toLowerCase() === 'test'
      },
      {
        id: 2,
        text: 'A strange message was intercepted. It is a Caesar cipher shifted forward by 5: "UWFUT"',
        key_reward: 'PLANT',
        hint: 'Move each letter backwards in the alphabet by 5 spaces. U -> P...',
        validate: (answer) => answer.trim().toLowerCase() === 'plant'
      }
    ]
  },
  {
    level: 4,
    name: 'Code Logic Chamber',
    variants: [
      {
        id: 0,
        text: 'let x = 10;\nfor(let i=0; i<5; i++) { x += i; }\nconsole.log(x + 15);\n// What is printed?',
        key_reward: '35',
        hint: 'The loop adds 0 + 1 + 2 + 3 + 4 to 10, making x = 20. Then it prints x + 15.',
        validate: (answer) => answer.trim() === '35'
      },
      {
        id: 1,
        text: 'let a = 5;\nlet b = a++ + ++a;\nconsole.log(b);\n// What is printed?',
        key_reward: '12',
        hint: 'a++ evaluates to 5, then a becomes 6. ++a increments a to 7 and evaluates to 7. 5 + 7 = ?',
        validate: (answer) => answer.trim() === '12'
      },
      {
        id: 2,
        text: 'let arr = [1, 2, 3];\nlet res = arr.map(x => x*2).reduce((a,b)=>a+b);\nconsole.log(res);\n// What is printed?',
        key_reward: '12',
        hint: 'map doubles each to [2,4,6]. reduce sums them up.',
        validate: (answer) => answer.trim() === '12'
      }
    ]
  },
  {
    level: 5,
    name: 'Internet Investigation',
    variants: [
      {
        id: 0,
        text: 'What year was the GNU project first announced by Richard Stallman?',
        key_reward: '1983',
        hint: 'Search online for "GNU project announced by Richard Stallman year".',
        validate: (answer) => answer.trim() === '1983'
      },
      {
        id: 1,
        text: 'What year was the first version of the Linux kernel released?',
        key_reward: '1991',
        hint: 'Search online for "Linux kernel initial release year".',
        validate: (answer) => answer.trim() === '1991'
      },
      {
        id: 2,
        text: 'In what year was Firefox 1.0 officially released?',
        key_reward: '2004',
        hint: 'Search online for "Firefox 1.0 release year".',
        validate: (answer) => answer.trim() === '2004'
      }
    ]
  },
  {
    level: 6,
    name: 'Final Meta Puzzle',
    variants: [
      {
        id: 0, // Level 6 doesn't really have randomized variants for its text, it just uses the collected keys
        text: 'You have collected 5 keys. Calculate the sum of the lengths of the keys in order to escape.\nWARNING: SYSTEM OVERLOAD IMMINENT.',
        key_reward: 'ESCAPE COMPLETE',
        hint: 'Count the letters/digits in each of the 5 keys you found, and sum those 5 numbers together.',
        validate: (answer, keys_discovered) => {
          let sum = 0;
          for (const key of keys_discovered) {
            sum += key.toString().length;
          }
          return answer.trim() === sum.toString();
        }
      }
    ]
  }
];

function getLevelInfo(levelNumber, variantId) {
  const l = levels.find((x) => x.level === levelNumber);
  if (!l) return null;
  const variant = l.variants.find(v => v.id === variantId);
  return { level: l.level, name: l.name, text: variant ? variant.text : l.variants[0].text };
}

function getLevelHint(levelNumber, variantId) {
  const l = levels.find((x) => x.level === levelNumber);
  if (!l) return 'No hint available.';
  const variant = l.variants.find(v => v.id === variantId);
  return variant ? variant.hint : 'No hint available.';
}

function validateAnswer(levelNumber, variantId, answer, keys_discovered = []) {
  const l = levels.find((x) => x.level === levelNumber);
  if (!l) return { isCorrect: false };
  const variant = l.variants.find(v => v.id === variantId) || l.variants[0];
  
  // Level 6 needs keys_discovered
  const isCorrect = variant.validate(answer, keys_discovered);
  return { isCorrect, key_reward: isCorrect ? variant.key_reward : null };
}

module.exports = {
  levels,
  getLevelInfo,
  getLevelHint,
  validateAnswer
};
