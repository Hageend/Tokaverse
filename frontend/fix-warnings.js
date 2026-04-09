const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(path.join(__dirname, 'components'), handleFile);
walk(path.join(__dirname, 'app'), handleFile);

function handleFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix expo-image resizeMode
    content = content.replace(/resizeMode=/g, 'contentFit=');
    
    // Fix pointerEvents
    // Replaces pointerEvents="none" with Platform-specific logic if possible, 
    // but easiest is to just let it be and patch console.warn for RNW issues.
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}
