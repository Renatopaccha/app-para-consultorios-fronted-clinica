import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add state variables if not exists
if (!content.includes('const [eventDate, setEventDate]')) {
  const stateInjection = `
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventTitle, setEventTitle] = useState("");
`;
  content = content.replace(
    'const [customTime, setCustomTime] = useState(false);',
    'const [customTime, setCustomTime] = useState(false);' + stateInjection
  );
}

// Update handleCreateEvent
const newHandler = `
  const handleCreateEvent = async () => {
    try {
      const type = modalInitialTab;
      
      const res = await createAppointment({
        clinicId: selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic,
        date: new Date(eventDate).toISOString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        type,
        title: eventTitle || (type === 'cita' ? 'Cita' : 'Bloqueo')
      });
      
      console.log("Evento creado exitosamente:", res);
      
      setIsModalOpen(false);
      refetchEvents();
    } catch (error) {
      console.error("Error al crear evento:", error);
      alert("Error al crear el evento");
    }
  };
`;
content = content.replace(
  /const handleCreateEvent = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/,
  newHandler.trim()
);

// Replace inputs for Cita Date
content = content.replace(
  /<input type="date" className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500\/20 bg-white" \/>/g,
  `<input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white" />`
);

// We need to inject eventTitle for Bloqueo and Personal
content = content.replace(
  /<input type="text" placeholder="Ej\. Vacaciones, Conferencia\.\.\." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500\/20 bg-white" \/>/g,
  `<input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Ej. Vacaciones, Conferencia..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />`
);

content = content.replace(
  /<input type="text" placeholder="Ej\. Trámite bancario, Asunto familiar\.\.\." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500\/20 bg-white" \/>/g,
  `<input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Ej. Trámite bancario, Asunto familiar..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 bg-white" />`
);

// TimeSelectGroup component doesn't seem to take props, wait... TimeSelectGroup is just UI.
// Let's modify TimeSelectGroup to receive props or remove it and just use raw inputs for simplicity if it's not taking props.
// Let's just find TimeSelectGroup in the file and modify it.

fs.writeFileSync(file, content);
console.log("Updated WorkScheduleView.tsx with state");
