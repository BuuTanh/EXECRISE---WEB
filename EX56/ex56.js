function getInput() {
    return document.getElementById('inputData').value;
}

function setResult(value) {
    document.getElementById('resultData').value = value;
}


function enterData() {
    const text = getInput();
    setResult(text);
}

function countUppercase() {
    const text = getInput();
    let count = 0;
    for (let i = 0; i < text.length; i++)
    {
        if (text[i] >= 'A' && text[i] <= 'Z')
        {
            count++;
        }
    }
    setResult("Number of uppercase characters: " + count);
}

function displayUppercase() {
    const text = getInput();
    setResult(text.toUpperCase());
}


function outputOneWordPerLine() {
    const text = getInput();
    const words = text.trim().split(/\s+/);
    setResult(words.join('\n'));
}

function displayLowercase() {
    const text = getInput();
    setResult(text.toLowerCase());
}

function countWords() {
    const text = getInput().trim(); 
    if (text === "") {
        setResult("Word count: 0");
        return;
    }
    const words = text.split(/\s+/);
    setResult("Word count: " + words.length);
}

function countLowercase() {
    const text = getInput();
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] >= 'a' && text[i] <= 'z') {
            count++;
        }
    }
    setResult("Number of lowercase characters: " + count);
}

function printVowelsConsonants() {
    const text = getInput().toLowerCase(); 
    const vowels = "aeiou";
    let vowelCount = 0;
    let consonantCount = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (vowels.includes(char)) {
            vowelCount++;
        } else if (char >= 'a' && char <= 'z') {
            consonantCount++;
        }
    }
    setResult("Vowels: " + vowelCount + "\nConsonants: " + consonantCount);
}

function openW3C() {
    window.open("https://www.w3.org/", "_blank");
}