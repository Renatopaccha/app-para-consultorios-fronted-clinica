import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/dashboard/WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

const newTimeSelectGroup = `
interface TimeSelectGroupProps {
  value: string;
  onChange: (val: string) => void;
}

const TimeSelectGroup = ({ value, onChange }: TimeSelectGroupProps) => {
  const [h24, m] = (value || "09:00").split(':');
  const numH = parseInt(h24, 10);
  const ampm = numH >= 12 ? 'PM' : 'AM';
  const h12 = (numH % 12) || 12;

  const updateTime = (newH12: number, newM: string, newAmPm: string) => {
    let finalH24 = newH12;
    if (newAmPm === 'PM' && finalH24 < 12) finalH24 += 12;
    if (newAmPm === 'AM' && finalH24 === 12) finalH24 = 0;
    onChange(\`\${finalH24.toString().padStart(2, '0')}:\${newM}\`);
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative">
        <select value={h12} onChange={e => updateTime(parseInt(e.target.value, 10), m, ampm)} className="w-14 sm:w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
          {Array.from({length: 12}, (_,i) => <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>)}
        </select>
      </div>
      <span className="text-slate-400 font-bold">:</span>
      <div className="relative">
        <select value={m} onChange={e => updateTime(h12, e.target.value, ampm)} className="w-14 sm:w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-white appearance-none text-center">
          {['00', '15', '30', '45'].map(min => <option key={min} value={min}>{min}</option>)}
        </select>
      </div>
      <div className="relative ml-0.5">
        <select value={ampm} onChange={e => updateTime(h12, m, e.target.value)} className="w-16 px-1.5 sm:px-2 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 bg-slate-50 appearance-none text-center">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};
`;

content = content.replace(
  /const TimeSelectGroup = \(\) => \([\s\S]*?\);\n/m,
  newTimeSelectGroup
);

// We have 3 instances of <TimeSelectGroup /> per tab if they have start and end time.
// Wait, looking at the previous grep, there was only `<TimeSelectGroup />` without props in the modal.
// Let's replace the first one with eventStartTime and the second one with eventEndTime for each tab.
// Actually, let's just use simple regex replacement. The first <TimeSelectGroup /> in a block is start, the second is end.
// Let's find all instances of <TimeSelectGroup />
let count = 0;
content = content.replace(/<TimeSelectGroup \/>/g, () => {
  count++;
  if (count % 2 === 1) return `<TimeSelectGroup value={eventStartTime} onChange={setEventStartTime} />`;
  else return `<TimeSelectGroup value={eventEndTime} onChange={setEventEndTime} />`;
});

fs.writeFileSync(file, content);
console.log("Updated TimeSelectGroup and injected props");
