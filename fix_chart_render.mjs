import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /<BarChart data=\{stats\.chartData\}>[\s\S]*?<\/BarChart>/;

const newCode = `<BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={isDark ? "#475569" : "#94A3B8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        color: isDark ? '#ffffff' : '#0f172a'
                      }}
                      labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="stickSold" name="Stick Kulfi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="potSold" name="Pot Kulfi" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>`;

content = content.replace(regex, newCode);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
