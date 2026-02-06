const XLSX = require('xlsx');
const fs = require('fs');

// Load the workbook
const workbook = XLSX.readFile('Feb.xlsx');

// Assuming the first sheet contains the data
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert sheet to JSON
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Raw data sample:', data.slice(0, 5));

// Transform data into a cleaner format
// Based on debug output: 
// Index 0: null or ID?
// Index 1: English
// Index 2: Japanese
const words = data.filter(row => {
    // Filter out rows where English column is empty or is the header
    return row[1] && row[1] !== '英単語' && row[1] !== 'English';
}).map(row => {
    return {
        english: row[1],
        japanese: row[2]
    };
});

// Save as a JS file that sets a global variable (easiest for local non-server logic)
const jsContent = `window.wordList = ${JSON.stringify(words, null, 2)};`;

fs.writeFileSync('words.js', jsContent);
console.log('Successfully created words.js with ' + words.length + ' entries.');
