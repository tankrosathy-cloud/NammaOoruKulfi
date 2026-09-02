const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Plate card closing
code = code.replace(
  '                  </CardContent>\n                </Card>\n              </div>\n            </div>\n          )}',
  '                  </CardContent>\n                </Card>\n              )}\n              </div>\n            </div>\n          )}'
);

// Settings.tsx(1805)
const match = code.match(/SAVE SETTINGS.*?<\/Button>\n\s*<\/form>\n\s*<\/CardContent>\n\s*<\/Card>\n\n\s*\{\/\* Session Management/);
if (match) {
  // It says line 1805 ) expected. Let's look around line 1800.
}
fs.writeFileSync('src/pages/Settings.tsx', code);
