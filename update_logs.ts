import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacement = `
  const handleCreateEvent = async () => {
    try {
      const type = modalInitialTab;
      
      const payload = {
        clinicId: selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic,
        date: new Date(eventDate).toISOString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        type,
        title: eventTitle || (type === 'cita' ? 'Cita' : 'Bloqueo')
      };
      
      console.log("====================================");
      console.log("🚀 [handleCreateEvent] ENVIANDO PETICIÓN A BACKEND");
      console.log("PAYLOAD COMPLETO:", JSON.stringify(payload, null, 2));
      console.log("TAB ACTIVO (TYPE):", type);
      console.log("FECHA CRUDA:", eventDate);
      console.log("FECHA ISO:", payload.date);
      console.log("HORA INICIO:", payload.startTime);
      console.log("HORA FIN:", payload.endTime);
      console.log("CLINICA:", payload.clinicId);
      console.log("====================================");

      const res = await createAppointment(payload);
      
      console.log("✅ Evento creado exitosamente:", res);
      
      setIsModalOpen(false);
      refetchEvents();
    } catch (error: any) {
      console.error("❌ Error devuelto al crear evento:", error);
      alert(\`Error al crear el evento: \${error.message || 'Desconocido'}\`);
    }
  };
`;

content = content.replace(
  /const handleCreateEvent = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/,
  replacement.trim()
);

fs.writeFileSync(file, content);
console.log("Updated logs in WorkScheduleView.tsx");
