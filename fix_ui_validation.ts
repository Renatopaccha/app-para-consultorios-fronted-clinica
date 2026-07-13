import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update handleCreateEvent for Clinic Validation
const newValidation = `
  const handleCreateEvent = async () => {
    try {
      const type = modalInitialTab;
      
      const finalClinicId = selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic;
      
      if (!finalClinicId) {
        alert("Para agendar una cita, primero debes registrar una sede o consultorio en tu perfil.");
        return;
      }
      
      const payload = {
        clinicId: finalClinicId,
`;

content = content.replace(
  /const handleCreateEvent = async \(\) => \{\n\s*try \{\n\s*const type = modalInitialTab;\n\s*const payload = \{\n\s*clinicId: selectedClinic === 'all' \? \(clinics\[0\]\?\.id \|\| ''\) : selectedClinic,/,
  newValidation.trim()
);

// Update eventStartTime setter to also update eventEndTime
// The state is defined as: const [eventStartTime, setEventStartTime] = useState("09:00");
// We should replace setEventStartTime with a custom handler.
const customTimeHandler = `
  const [eventStartTime, _setEventStartTime] = useState("09:00");
  
  const handleStartTimeChange = (newStartTime: string) => {
    _setEventStartTime(newStartTime);
    
    // Calcular endTime (+1 hora)
    const [h, m] = newStartTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const nextH = (h + 1) % 24;
      setEventEndTime(\`\${nextH.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`);
    }
  };
`;

content = content.replace(
  /const \[eventStartTime, setEventStartTime\] = useState\("09:00"\);/,
  customTimeHandler.trim()
);

// Replace setEventStartTime with handleStartTimeChange in the JSX
content = content.replace(/onChange=\{setEventStartTime\}/g, 'onChange={handleStartTimeChange}');

fs.writeFileSync(file, content);
console.log("Updated WorkScheduleView.tsx with validations");
