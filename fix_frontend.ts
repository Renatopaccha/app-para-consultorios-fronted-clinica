import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Inject States
const newStates = `
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventStartTime, _setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventTitle, setEventTitle] = useState("");
  
  // Patient form states
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientCedula, setPatientCedula] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
`;

content = content.replace(
  /const \[eventDate, setEventDate\] = useState<Date>\(new Date\(\)\);[\s\S]*?const \[eventTitle, setEventTitle\] = useState\(""\);/,
  newStates.trim()
);

// 2. Modify UI 
const newForm = `
                   <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                     <div className="flex items-center gap-2 mb-1">
                       <UserPlus className="w-4 h-4 text-sky-500" />
                       <span className="text-sm font-semibold text-slate-700">Datos del Paciente</span>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <input type="text" value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} placeholder="Nombre *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                       <input type="text" value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} placeholder="Apellido *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="Correo Electrónico *" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                       <input type="text" value={patientCedula} onChange={(e) => setPatientCedula(e.target.value)} placeholder="Cédula (Opcional)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white transition-all" />
                     </div>
                   </div>
`;

content = content.replace(
  /<div className="space-y-1\.5">[\s\S]*?<div className="flex justify-between items-center">[\s\S]*?<label className="text-xs font-semibold text-slate-700">Paciente<\/label>[\s\S]*?<button className="text-\[11px\] font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors">[\s\S]*?<UserPlus className="w-3 h-3" \/> Nuevo paciente[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<div className="relative">[\s\S]*?<Search className="absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" \/>[\s\S]*?<input type="text" placeholder="Buscar paciente por nombre o cédula\.\.\." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500\/20 bg-white" \/>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  newForm.trim()
);

// 3. Update handleCreateEvent
const newHandleCreateEvent = `
  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      const type = modalInitialTab;
      
      const finalClinicId = selectedClinic === 'all' ? (clinics[0]?.id || '') : selectedClinic;
      
      if (!finalClinicId) {
        alert("Para agendar una cita, primero debes registrar una sede o consultorio en tu perfil.");
        setIsSubmitting(false);
        return;
      }
      
      let realPatientId = undefined;
      
      if (type === 'cita') {
        if (!patientFirstName.trim() || !patientLastName.trim() || !patientEmail.trim()) {
          alert('Por favor completa el nombre, apellido y correo del paciente.');
          setIsSubmitting(false);
          return;
        }

        // Crear/Buscar la cuenta fantasma
        const guestResponse = await apiClient.post('/api/doctors/patients/guest', {
          firstName: patientFirstName,
          lastName: patientLastName,
          email: patientEmail,
          cedula: patientCedula
        });
        realPatientId = guestResponse.data.patientId;
      }
      
      const payload: any = {
        clinicId: finalClinicId,
        date: new Date(eventDate).toISOString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        type,
        title: eventTitle || (type === 'cita' ? 'Cita' : 'Bloqueo')
      };
      
      if (type === 'cita') {
        payload.patientId = realPatientId;
        payload.serviceId = 'temp-service-123';
      }
      
      console.log("====================================");
      console.log("🚀 [handleCreateEvent] ENVIANDO PETICIÓN A BACKEND");
      console.log("PAYLOAD COMPLETO:", JSON.stringify(payload, null, 2));
      console.log("====================================");

      const res = await createAppointment(payload);
      console.log("✅ Evento creado exitosamente:", res);
      
      setIsModalOpen(false);
      refetchEvents();
      
      // Reset forms
      setPatientFirstName("");
      setPatientLastName("");
      setPatientEmail("");
      setPatientCedula("");
      
    } catch (error: any) {
      console.error("❌ Error devuelto al crear evento:", error);
      alert(\`Error al crear el evento: \${error.response?.data?.error || error.message || 'Desconocido'}\`);
    } finally {
      setIsSubmitting(false);
    }
  };
`;

content = content.replace(
  /const handleCreateEvent = async \(\) => \{[\s\S]*?\} catch \(error: any\) \{[\s\S]*?\}[\s\S]*?\};/,
  newHandleCreateEvent.trim()
);

fs.writeFileSync(file, content);
console.log("Updated WorkScheduleView.tsx with Patient Form and integration logic");
