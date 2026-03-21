import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Task } from '../types';
import { TrendingUp, Activity } from 'lucide-react';

interface AnalyticsProps {
  tasks: Task[];
}

const MOCK_DATA = [
  { name: 'Mon', completion: 65 },
  { name: 'Tue', completion: 45 },
  { name: 'Wed', completion: 85 },
  { name: 'Thu', completion: 70 },
  { name: 'Fri', completion: 90 },
  { name: 'Sat', completion: 55 },
  { name: 'Sun', completion: 80 },
];

export function Analytics({ tasks }: AnalyticsProps) {
  const completionRate = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
    : 0;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Performance
        </h2>
        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full">
          +12% vs last week
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-bold">Completion</p>
          <p className="text-2xl font-bold text-white mt-1">{Math.round(completionRate)}%</p>
        </div>
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-bold">Focus Score</p>
          <p className="text-2xl font-bold text-white mt-1">8.4</p>
        </div>
      </div>

      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DATA}>
            <defs>
              <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#71717a" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Area 
              type="monotone" 
              dataKey="completion" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorComp)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span>Productivity impact is high for current tasks</span>
        </div>
      </div>
    </div>
  );
}
