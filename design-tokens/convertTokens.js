import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processTokens(obj, prefix = '', variables = {}) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if ('value' in obj[key] && 'type' in obj[key]) {
        // It's a token
        const token = obj[key];
        let varName = `--${prefix}${key}`.replace(/\s+/g, '-').toLowerCase();
        
        // Skip primitives if they exist (based on user request)
        if (varName.includes('primitive')) {
          continue;
        }

        let value = token.value;

        if (token.type === 'dimension') {
          if (typeof value === 'number' && value !== 0) {
            value = `${value}px`;
          } else if (value === 0) {
            value = '0';
          }
        }

        variables[varName] = value;
      } else {
        // It's a group
        const newPrefix = prefix ? `${prefix}${key}-` : `${key}-`;
        processTokens(obj[key], newPrefix, variables);
      }
    }
  }
  return variables;
}

function generateCSS() {
  const coloursObj = JSON.parse(fs.readFileSync(path.join(__dirname, 'colours.tokens.json.json'), 'utf8'));
  const typographyObj = JSON.parse(fs.readFileSync(path.join(__dirname, 'typography.tokens.json.json'), 'utf8'));

  let variables = {};
  
  // As per instructions: color system contains color roles and primitive colors, 
  // UI only uses color roles. We will process colours. 
  // We can filter out groups named "primitive" or "primitives".
  variables = processTokens(coloursObj, '', variables);
  variables = processTokens(typographyObj, '', variables);

  let cssContent = ':root {\n';
  for (const [varName, value] of Object.entries(variables)) {
    cssContent += `  ${varName}: ${value};\n`;
  }
  cssContent += '}\n';

  fs.writeFileSync(path.join(__dirname, '../variables.css'), cssContent);
  console.log('Successfully generated variables.css');
}

generateCSS();
