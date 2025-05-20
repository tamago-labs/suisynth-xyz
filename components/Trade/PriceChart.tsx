import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bitcoin, RefreshCw, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

const PriceChart = () => {

  // console.log("pool data: ", poolData)

  const [timeframe, setTimeframe] = useState('24h');
  const [chartData, setChartData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  // Mock data for demonstration - in production, replace with API calls
  const fetchChartData = async (selectedTimeframe: any) => {
    setLoading(true);

    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate chart data based on timeframe
    const now = new Date();
    let startTime;
    let interval;
    let dataPoints;

    switch (selectedTimeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        interval = 5 * 60 * 1000; // 5 minutes
        dataPoints = 12;
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = 60 * 60 * 1000; // 1 hour
        dataPoints = 24;
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 6 * 60 * 60 * 1000; // 6 hours
        dataPoints = 28;
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = 24 * 60 * 60 * 1000; // 1 day
        dataPoints = 30;
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = 60 * 60 * 1000; // 1 hour
        dataPoints = 24;
    }

    // Current BTC price from pool data or default to 65000
    const currentPrice = 95000;

    // Generate data with realistic price movements
    let mockData: any = [];
    let currentValue = currentPrice * 0.85; // Start somewhat lower than current

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(startTime.getTime() + (i * interval));

      // Create somewhat realistic price movements
      // Trend generally upward to reach current price
      const volatility = currentPrice * 0.01; // 1% volatility
      const trendFactor = (currentPrice - currentValue) / (dataPoints - i);
      const change = trendFactor + (Math.random() - 0.3) * volatility;

      currentValue += change;

      mockData.push({
        timestamp: timestamp,
        price: currentValue,
        time: formatTime(timestamp, selectedTimeframe),
      });
    }

    setChartData(mockData);
    setLoading(false);
  };

  const formatTime = (date: any, timeframe: any) => {
    if (timeframe === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  useEffect(() => {
    fetchChartData(timeframe);
  }, [timeframe]);

  // Calculate price change
  const calculateChange = () => {
    if (chartData.length < 2) return { value: 0, percentage: 0 };

    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;

    return {
      value: change,
      percentage: percentage
    };
  };

  const priceChange = calculateChange();
  const isPriceUp = priceChange.value >= 0;

  const timeframeOptions: any = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-slate-300 text-xs">{payload[0].payload.time}</p>
          <p className="text-white font-medium">${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4  ">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3  ">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Bitcoin className="text-orange-500" size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold">suiBTC</h3>
            <div className="flex items-center text-sm">
              <span className="text-slate-400 mr-2">Price:</span>
              <span className="font-mono">${(95000).toLocaleString()}</span>
              <span className={`flex items-center text-sm ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                {isPriceUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(priceChange.percentage).toFixed(2)}%
              </span>
            </div>
          </div>
          {/*<h3 className="text-xl font-bold">suiBTC</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-mono">${(95000).toLocaleString()}</span>
            <span className={`flex items-center text-sm ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
              {isPriceUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(priceChange.percentage).toFixed(2)}%
            </span>
          </div>*/}
        </div>
        <div className="relative">
          <button
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors"
            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
          >
            {timeframeOptions.find((option: any) => option.value === timeframe).label}
            <ChevronDown size={16} />
          </button>

          {showTimeframeDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded-lg shadow-lg z-10 border border-slate-600 w-20">
              {timeframeOptions.map((option: any) => (
                <button
                  key={option.value}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => {
                    setTimeframe(option.value);
                    setShowTimeframeDropdown(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <RefreshCw className="animate-spin text-slate-400" size={24} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 1000', 'dataMax + 1000']}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              width={60}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPriceUp ? "#10b981" : "#f43f5e"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: isPriceUp ? "#10b981" : "#f43f5e", strokeWidth: 2, fill: "#1e293b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PriceChart;