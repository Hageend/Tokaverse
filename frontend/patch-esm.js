const fs = require('fs');
const path = require('path');

function patchDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    let patched = 0;
    
    function walk(dir) {
        const list = fs.readdirSync(dir);
        list.forEach(function(file) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                walk(filePath);
            } else {
                if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
                    let content = fs.readFileSync(filePath, 'utf8');
                    // Replace import.meta with process.env or empty object to prevent SyntaxErrors in the browser bundle
                    if (content.includes('import.meta')) {
                        content = content.replace(/import\.meta\.env/g, '(process ? process.env : {})');
                        content = content.replace(/import\.meta/g, '({ env: (process ? process.env : {}) })');
                        fs.writeFileSync(filePath, content, 'utf8');
                        patched++;
                        console.log('Patched: ' + filePath);
                    }
                }
            }
        });
    }
    
    walk(dirPath);
    return patched;
}

const countZ = patchDirectory(path.join(__dirname, 'node_modules', 'zustand'));
const countS = patchDirectory(path.join(__dirname, 'node_modules', 'socket.io-client'));
const countE = patchDirectory(path.join(__dirname, 'node_modules', 'engine.io-client'));

console.log(`Patching complete. Modified: ${countZ + countS + countE} files.`);
