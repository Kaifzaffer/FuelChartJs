import react, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getPlaceName = (latitude, longitude) => {
  return `Place (${latitude}, ${longitude})`; 
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-2 border border-gray-300 rounded shadow">
        <p className="label">{`Time: ${label}`}</p>
        <p className="intro">{`Fuel Level: ${payload[0].value}`}</p>
        {payload[1] && (
          <p className="intro">{`Fuel Consumed: ${payload[1].value}`}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function Component() {
  const [chartData, setChartData] = useState([]);
  const [fuelFillEvents, setFuelFillEvents] = useState([]);
  const [totalFuelConsumed, setTotalFuelConsumed] = useState(0);

  useEffect(() => {
    fetch(`/response.json`)
      .then((response) => response.json())
      .then((data) => {
        let prevFuelLevel = null;
        let fuelConsumed = 0;
        const formattedData = data.map((item) => {
          const fuelLevel = parseFloat(item.fuel_level).toFixed(2);
          let fuelDiff = 0;

          if (prevFuelLevel !== null) {
            fuelDiff = fuelLevel - prevFuelLevel;

            if (fuelDiff < 0) {
              const placeName = getPlaceName(
                item.location.latitude,
                item.location.longitude
              );
              setFuelFillEvents((prev) => [
                ...prev,
                {
                  amount: Math.abs(fuelDiff),
                  location: placeName,
                  time: formatDate(item.timestamp),
                },
              ]);
            } else {
              fuelConsumed += fuelDiff;
            }
          }

          prevFuelLevel = fuelLevel;
          return {
            timestamp: formatDate(item.timestamp),
            fuelLevel,
            fuelConsumed: fuelConsumed.toFixed(2),
          };
        });

        setChartData(formattedData);
        setTotalFuelConsumed(fuelConsumed.toFixed(2));
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <h1 className="font-bold mb-4 text-center">Fuel Consumption</h1>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 6, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="5 5" />
          <XAxis
            dataKey="timestamp"
            label={{ value: "Timestamp", position: "bottom", offset: 30 }}
            angle={-45}
            textAnchor="end"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Fuel Level", angle: -90, position: "insideLeft" }}
            domain={[0, "dataMax + 50"]}
            ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400]}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="fuelLevel"
            stroke="green"
            dot={false}
            strokeWidth={2}
            name="Fuel Level"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="fuelConsumed"
            stroke="rgba(255, 0, 0, 0.5)"
            dot={false}
            strokeWidth={2}
            name="Fuel Consumed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
