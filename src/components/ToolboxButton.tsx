const ToolboxButton: React.FC<{ 
  onClick: () => void; 
  label: string; 
  h: string; 
  w: string; 
  color: string;
}> = ({ onClick, label, h, w, color }) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all group"
  >
    <div className={`${h} ${w} ${color} rounded-sm shadow-md group-hover:scale-110 transition-transform`}></div>
    <span className="text-xs text-slate-400 font-medium">{label}</span>
  </button>
);

export default ToolboxButton;