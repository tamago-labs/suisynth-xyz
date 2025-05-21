import { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bitcoin, RefreshCw, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AccountContext } from '@/hooks/useAccount';


const PriceChart = ({ currentPrice, setCurrentPrice }: any) => {
  const { getBTCPrices }: any = useContext(AccountContext);

  const [timeframe, setTimeframe] = useState<string>('24h');
  const [chartData, setChartData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState<boolean>(false);

  const fetchChartData = async (selectedTimeframe: any) => {
    setLoading(true);

    try {
      // Define filter parameters based on selected timeframe
      let timeFilter = {};
      const now = new Date();

      switch (selectedTimeframe) {
        case '1h':
          timeFilter = {
            createdAt: {
              gt: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
            }
          };
          break;
        case '24h':
          timeFilter = {
            createdAt: {
              gt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            }
          };
          break;
        case '7d':
          timeFilter = {
            createdAt: {
              gt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
          break;
        case '30d':
          timeFilter = {
            createdAt: {
              gt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
          break;
        default:
          timeFilter = {
            createdAt: {
              gt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            }
          };
      }

      // Get filtered data from the API using the correct filter syntax
      const data = await getBTCPrices(timeFilter);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Sort data by timestamp (newest to oldest)  
      const sortedData = data.sort((a: any, b: any) => {
        return (new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf())
      })

      // Set current price from the most recent data point
      setCurrentPrice(parseFloat(sortedData[0].lastPrice));

      // Process data based on the selected timeframe
      let processedData: any = [];

      // Filter and format data based on timeframe
      switch (selectedTimeframe) {
        case '1h':
          // For 1h, we'd need more frequent data points than what's available
          // Use the most recent data points and interpolate if needed
          processedData = sortedData.slice(0, 12).map((item: any) => ({
            timestamp: new Date(item.createdAt),
            price: parseFloat(item.lastPrice),
            time: formatTime(new Date(item.createdAt), selectedTimeframe)
          }));
          break;

        case '24h':
          // Use the available hourly data
          processedData = sortedData.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            price: parseFloat(item.lastPrice),
            time: formatTime(new Date(item.createdAt), selectedTimeframe)
          }));
          break;

        case '7d':
          // For 7d, we should have more data points but we'll use what we have
          processedData = sortedData.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            price: parseFloat(item.lastPrice),
            time: formatTime(new Date(item.createdAt), selectedTimeframe)
          }));
          break;

        case '30d':
          // For 30d, we should have more data points but we'll use what we have
          processedData = sortedData.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            price: parseFloat(item.lastPrice),
            time: formatTime(new Date(item.createdAt), selectedTimeframe)
          }));
          break;

        default:
          processedData = sortedData.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            price: parseFloat(item.lastPrice),
            time: formatTime(new Date(item.createdAt), selectedTimeframe)
          }));
      }

      // Reverse the data so it's oldest to newest for proper chart display
      setChartData(processedData.reverse());
    } catch (error) {
      console.error("Error fetching price data:", error);
    } finally {
      setLoading(false);
    }
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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Bitcoin className="text-orange-500" size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold">suiBTC</h3>
            <div className="flex items-center text-sm">
              <span className="text-slate-400 mr-2">Price:</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
              <span className={`ml-2 flex items-center text-sm ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                {isPriceUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(priceChange.percentage).toFixed(2)}%
              </span>
            </div>
          </div>
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
              domain={['auto', 'auto']}
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