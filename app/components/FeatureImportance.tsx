import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FeatureImportanceProps {
  featureImportance: { feature_importance: { [key: string]: number } };
}

const FeatureImportance: React.FC<FeatureImportanceProps> = ({ featureImportance }) => {
  const { feature_importance } = featureImportance;
  
  // Sort features by importance
  const sortedFeatures = Object.entries(feature_importance)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
  
  // Get top 3 features
  const topFeatures = sortedFeatures.slice(0, 3);
  
  const chartData = {
    labels: sortedFeatures.map(([feature]) => feature),
    datasets: [
      {
        label: 'Feature Importance',
        data: sortedFeatures.map(([, importance]) => importance),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };
  
  const chartOptions = {
    indexAxis: 'y' as const,
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            return context.dataset.label + ': ' + (context.raw as number).toFixed(4);
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Feature Importance</CardTitle>
        <CardDescription>
          Relative importance of features in the model
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {topFeatures.map(([feature, importance], index) => (
            <Badge key={feature} variant="outline" className="bg-gray-50 py-1 px-3 text-xs">
              <span className="font-medium mr-2">{index + 1}.</span>
              <span className="font-mono">{feature}:</span>
              <span className="ml-1 font-mono">{importance.toFixed(4)}</span>
            </Badge>
          ))}
        </div>
        
        <div className="h-96 mt-4">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportance;