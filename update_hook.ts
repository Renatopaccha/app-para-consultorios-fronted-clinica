import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/hooks/useCalendarData.ts');
let content = fs.readFileSync(file, 'utf8');

const adapterReplace = `
  let finalStatus = appt.status;
  if (appt.status === 'PENDING' && (appt.title === 'Bloqueo de Horario' || appt.patient_name === 'Bloqueo Sistema' || appt.notes === 'bloqueo' || appt.notes === 'personal')) {
    finalStatus = 'BLOCKED_GOOGLE';
  }

  return {
    id: appt.id,
    title: appt.title,
    patientName: appt.patient_name ?? undefined,
    startTime: \`\${hh}:\${mm}\`,
    duration: appt.duration_minutes,
    dayIndex,
    status: finalStatus,
    clinicId: appt.clinic_id,
  };
`;

content = content.replace(
  /return \{\n\s*id: appt\.id,\n\s*title: appt\.title,\n\s*patientName: appt\.patient_name \?\? undefined,\n\s*startTime: `\$\{hh\}:\$\{mm\}`,\n\s*duration: appt\.duration_minutes,\n\s*dayIndex,\n\s*status: appt\.status,\n\s*clinicId: appt\.clinic_id,\n\s*\};\n/s,
  adapterReplace
);

fs.writeFileSync(file, content);
console.log("Updated useCalendarData.ts with block status mapping");
