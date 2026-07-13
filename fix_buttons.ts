import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix buttons
content = content.replace(
  /<button className="(w-full mt-2 py-2\.5 bg-sky-500[^"]+)">\s*Agendar Cita\s*<\/button>/g,
  '<button onClick={handleCreateEvent} className="$1">\n                     Agendar Cita\n                   </button>'
);

content = content.replace(
  /<button className="(w-full mt-2 py-2\.5 bg-slate-800[^"]+)">\s*Bloquear Horario\s*<\/button>/g,
  '<button onClick={handleCreateEvent} className="$1">\n                   Bloquear Horario\n                 </button>'
);

// We already did "Guardar Evento Personal", but let's re-verify it just in case.
content = content.replace(
  /<button className="(w-full mt-2 py-2\.5 bg-indigo-500[^"]+)">\s*Guardar Evento Personal\s*<\/button>/g,
  '<button onClick={handleCreateEvent} className="$1">\n                   Guardar Evento Personal\n                 </button>'
);

// Add patientId and serviceId to the payload in handleCreateEvent
const newPayload = `
      const payload = {
        clinicId: selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic,
        date: new Date(eventDate).toISOString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        type,
        title: eventTitle || (type === 'cita' ? 'Cita' : 'Bloqueo'),
        ...(type === 'cita' ? { patientId: 'temp-patient-123', serviceId: 'temp-service-123' } : {})
      };
`;

content = content.replace(
  /const payload = \{[\s\S]*?title: eventTitle \|\| \(type === 'cita' \? 'Cita' : 'Bloqueo'\)\n\s*\};/,
  newPayload.trim()
);

fs.writeFileSync(file, content);
console.log("Updated buttons and payload in WorkScheduleView.tsx");
