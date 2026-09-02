const fs = require('fs');
let code = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');

code = code.replace(
  'onChange={handleChange} onFocus={handleFocus} />\n                    </div>\n                  </div>\n                </div>\n              </div>\n\n              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">',
  'onChange={handleChange} onFocus={handleFocus} />\n                    </div>\n                  </div>)}\n                </div>\n              </div>\n\n              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">'
);
fs.writeFileSync('src/pages/AddEntry.tsx', code);
