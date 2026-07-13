import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /,\n\s*\.\.\.\(type === 'cita' \? \{ patientId: 'temp-patient-123', serviceId: 'temp-service-123' \} : \{\}\)/;

content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log("Cleaned up temp IDs from WorkScheduleView.tsx");
