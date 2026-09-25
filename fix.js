const fs = require('fs');
const path = 'C:/DEV/CineLog/cinelog-ui/src/pages/Profile.jsx';
let content = fs.readFileSync(path, 'utf8');

// Mojibake mapping
const fixes = {
    'Ä°': 'İ',
    'Ä±': 'ı',
    'Ã–': 'Ö',
    'Ã¶': 'ö',
    'Ã‡': 'Ç',
    'Ã§': 'ç',
    'Åž': 'Ş',
    'ÅŸ': 'ş',
    'Ãœ': 'Ü',
    'Ã¼': 'ü',
    'Äž': 'Ğ',
    'ÄŸ': 'ğ',
    'Ã¢': 'â',
    'Ã®': 'î'
};

for (const [bad, good] of Object.entries(fixes)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed encoding issues in Profile.jsx');
