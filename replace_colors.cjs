const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:\\Users\\DELL\\Documents\\barbersiteweb-2\\src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('View.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply specific replacements to match Devoluciones al Stock palette
    content = content.replace(/bg-\[#D4AF37\] hover:bg-\[#B8941F\] text-black/g, 'bg-blue-600 hover:bg-blue-700 text-white');
    content = content.replace(/bg-\[#D4AF37\] hover:bg-\[#B8941F\]/g, 'bg-blue-600 hover:bg-blue-700');
    content = content.replace(/bg-\[#D4AF37\] hover:bg-\[#b8941f\]/g, 'bg-blue-600 hover:bg-blue-700');
    content = content.replace(/bg-\[#D4AF37\]/g, 'bg-blue-600');
    
    // Texts
    content = content.replace(/text-\[#D4AF37\]/g, 'text-blue-800'); 
    content = content.replace(/text-\[#AF8D1E\]/g, 'text-blue-700');

    // Borders
    content = content.replace(/border-\[#D4AF37\]\/\d+/g, 'border-blue-200');
    content = content.replace(/border-\[#D4AF37\]/g, 'border-blue-200');

    // Gradients
    content = content.replace(/from-\[#D4AF37\]\/\d+/g, 'from-blue-50');
    content = content.replace(/from-\[#D4AF37\]/g, 'from-blue-50');
    content = content.replace(/to-\[#B8941F\]\/\d+/g, 'to-blue-100');
    content = content.replace(/to-\[#B8941F\]/g, 'to-blue-100');
    content = content.replace(/via-\[#D4AF37\]\/\d+/g, 'via-blue-50');
    content = content.replace(/via-\[#D4AF37\]/g, 'via-blue-50');

    // Specific backgrounds with opacity
    content = content.replace(/bg-\[#D4AF37\]\/\d+/g, 'bg-blue-50');
    
    // Shadows
    content = content.replace(/shadow-\[#D4AF37\]\/\d+/g, 'shadow-blue-200/50');
    content = content.replace(/shadow-\[#D4AF37\]/g, 'shadow-blue-200');

    // SVG colors (like Recharts)
    content = content.replace(/fill="#D4AF37"/g, 'fill="#2563eb"');
    content = content.replace(/stroke="#D4AF37"/g, 'stroke="#2563eb"');
    content = content.replace(/fill:\s*'#D4AF37'/g, "fill: '#2563eb'");
    content = content.replace(/stroke:\s*'#D4AF37'/g, "stroke: '#2563eb'");
    content = content.replace(/'#B8860B'/g, "'#1e40af'");

    // Array of colors or specific strings (Recharts, etc)
    content = content.replace(/'#D4AF37'/g, "'#2563eb'");
    content = content.replace(/'#B8941F'/g, "'#1d4ed8'");
    
    // Also replace in other common UI colors that might be missed
    content = content.replace(/text-\[#B8941F\]/g, 'text-blue-700');

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
