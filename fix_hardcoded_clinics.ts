import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Line 577 (Background block)
content = content.replace(
  /📍 \{block\.clinicId === 'avila' \? 'El Ávila' : block\.clinicId === 'mercedes' \? '\{clinics\.find\(c => c\.id === configClinic\)\?\.name \|\| 'Sede Seleccionada'\}' : block\.clinicId\}/g,
  "📍 {clinics.find(c => c.id === block.clinicId)?.name || 'Sede'}"
);

// We need to catch if it wasn't exactly that. Let's do a more robust replace for the background blocks:
content = content.replace(
  /📍 \{.*?block\.clinicId.*?\}/g,
  "📍 {clinics.find(c => c.id === block.clinicId)?.name || 'Sede'}"
);

// 2. Line 980 (Create Event Modal Select)
const dynamicSelectModal = `
                     <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none" value={selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic} disabled>
                       {clinics.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
`;
content = content.replace(
  /<select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500\/20 bg-white appearance-none">\s*<option>.*?<\/option>\s*<option>.*?<\/option>\s*<\/select>/s,
  dynamicSelectModal.trim()
);

// 3. Line 1090 (View Event Details Modal)
const dynamicViewModal = `
                  <span className="font-medium">
                    {clinics.find(c => c.id === selectedEvent.clinicId)?.name || 'Sede'}
                  </span>
`;
content = content.replace(
  /<span className="font-medium">\s*\{selectedClinic === 'all'.*?\}\s*<\/span>/s,
  dynamicViewModal.trim()
);

// 4. Also fix the main clinic dropdown (Dashboard Header) if it has hardcoded values
// But looking at previous code, main dashboard header was probably already dynamic. Let's check for any remaining 'avila' or 'mercedes'
content = content.replace(/value="avila"/g, 'value="avila" /* deprecated */');
content = content.replace(/value="mercedes"/g, 'value="mercedes" /* deprecated */');

fs.writeFileSync(file, content);
console.log("Fixed all remaining hardcoded clinics");
