import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { createAppointment }')) {
  content = content.replace(
    "import { useCalendarData, type CalendarEvent } from \"../../hooks/useCalendarData\";",
    "import { useCalendarData, type CalendarEvent } from \"../../hooks/useCalendarData\";\nimport { createAppointment } from \"../../services/schedule.service\";"
  );
}

if (!content.includes('refetchEvents')) {
  content = content.replace(
    "errorMetrics,\n  } = useCalendarData({",
    "errorMetrics,\n    refetchEvents,\n  } = useCalendarData({"
  );
}

const handlerCode = `
  const handleCreateEvent = async () => {
    try {
      // 1. Tomamos los valores estáticos por ahora hasta que conectemos los inputs
      const type = modalInitialTab;
      
      const res = await createAppointment({
        clinicId: selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic,
        date: new Date().toISOString(),
        startTime: "09:00",
        endTime: "10:00",
        type,
        title: type === 'cita' ? 'Cita' : 'Bloqueo'
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

if (!content.includes('const handleCreateEvent')) {
  content = content.replace(
    "const handleSaveSchedule = () => {",
    handlerCode + "\n\n  const handleSaveSchedule = () => {"
  );
}

// Add to buttons
// Pestaña Cita
content = content.replace(
  /<button className="w-full mt-2 py-2\.5 bg-sky-500.*?Guardar Cita<\/button>/gs,
  `<button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all">Guardar Cita</button>`
);

// Pestaña Bloqueo
content = content.replace(
  /<button className="w-full mt-2 py-2\.5 bg-slate-800.*?Guardar Bloqueo<\/button>/gs,
  `<button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all">Guardar Bloqueo</button>`
);

// Pestaña Personal
content = content.replace(
  /<button className="w-full mt-2 py-2\.5 bg-indigo-500.*?Guardar Evento Personal<\/button>/gs,
  `<button onClick={handleCreateEvent} className="w-full mt-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm transition-all">Guardar Evento Personal</button>`
);

fs.writeFileSync(file, content);
console.log("Added handleCreateEvent to WorkScheduleView.tsx");
