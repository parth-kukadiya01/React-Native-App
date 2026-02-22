const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') && !file.endsWith('GlassView.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('BlurView')) {
        // Replace imports
        // Case 1: import { BlurView } from '@react-native-community/blur';
        content = content.replace(
            /import\s+\{\s*BlurView\s*\}\s+from\s+['"]@react-native-community\/blur['"];?/g,
            "import GlassView from '../components/GlassView';".replace('../', file.split('/').length > 3 ? '../../' : '../')
        );

        // Replace tags
        content = content.replace(/<BlurView/g, '<GlassView');
        content = content.replace(/<\/BlurView>/g, '</GlassView>');

        // Make sure import path to GlassView is vaguely correct.
        // A better heuristic for deep paths:
        const depth = file.split('/').length - 3; // src is depth 0
        const prefix = depth > 1 ? '../'.repeat(depth) : '../';
        
        if (content.includes("import GlassView from")) {
           content = content.replace(/import GlassView from '.*';/g, `import GlassView from '${prefix}components/GlassView';`);
        } else {
           content = `import GlassView from '${prefix}components/GlassView';\n` + content;
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
});
