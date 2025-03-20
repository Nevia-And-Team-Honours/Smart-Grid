/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ModelPerformanceProps {
  modelPerformance: any;
}

const ModelPerformance: React.FC<ModelPerformanceProps> = ({ modelPerformance }) => {
  const { accuracy, classification_report } = modelPerformance;
  console.log(classification_report,"classification_report")
  
  // Extract class names
  const classNames = Object.keys(classification_report).filter(key => 
    !['accuracy', 'macro avg', 'weighted avg'].includes(key)
  );
  
  // Professional color palette
  const colors = {
    precision: {
      backgroundColor: 'rgba(53, 162, 235, 0.7)',
      borderColor: 'rgba(53, 162, 235, 1)',
    },
    recall: {
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
    },
    f1Score: {
      backgroundColor: 'rgba(153, 102, 255, 0.7)',
      borderColor: 'rgba(153, 102, 255, 1)',
    }
  };
  
  // Generate colors for multiple classes
  const generateColorScale = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const hue = (i * 360) / count;
      return {
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
        borderColor: `hsla(${hue}, 70%, 60%, 1)`,
      };
    });
  };
  
  const classColors = generateColorScale(classNames.length);
  
  const precisionData = {
    labels: classNames,
    datasets: [
      {
        label: 'Precision',
        data: classNames.map(cls => classification_report[cls].precision),
        backgroundColor: colors.precision.backgroundColor,
        borderColor: colors.precision.borderColor,
        borderWidth: 1,
      }
    ]
  };
  
  const recallData = {
    labels: classNames,
    datasets: [
      {
        label: 'Recall',
        data: classNames.map(cls => classification_report[cls].recall),
        backgroundColor: colors.recall.backgroundColor,
        borderColor: colors.recall.borderColor,
        borderWidth: 1,
      }
    ]
  };
  
  const f1ScoreData = {
    labels: classNames,
    datasets: [
      {
        label: 'f1-score',
        data: classNames.map(cls => classification_report[cls]['f1-score']),
        backgroundColor: colors.f1Score.backgroundColor,
        borderColor: colors.f1Score.borderColor,
        borderWidth: 1,
      }
    ]
  };
  
  const supportData = {
    labels: classNames,
    datasets: [
      {
        label: 'Support',
        data: classNames.map(cls => classification_report[cls].support),
        backgroundColor: classNames.map((_, idx) => classColors[idx].backgroundColor),
        borderColor: classNames.map((_, idx) => classColors[idx].borderColor),
        borderWidth: 1,
      }
    ]
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Model Performance</CardTitle>
        <CardDescription>
          Evaluation metrics for the classification model
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Overall Accuracy</span>
            <Badge variant="outline" className="font-mono">
              {(accuracy * 100).toFixed(2)}%
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Based on {classification_report['macro avg'].support} test samples
          </div>
        </div>
        
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="charts">Visualization</TabsTrigger>
            <TabsTrigger value="details">Detailed Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts" className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border shadow-none">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium">Precision by Class</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-64">
                  <Bar data={precisionData} options={{ responsive: true, maintainAspectRatio: false }} />
                </CardContent>
              </Card>
              
              <Card className="border shadow-none">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium">Recall by Class</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-64">
                  <Bar data={recallData} options={{ responsive: true, maintainAspectRatio: false }} />
                </CardContent>
              </Card>
              
              <Card className="border shadow-none">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium">F1-Score by Class</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-64">
                  <Bar data={f1ScoreData} options={{ responsive: true, maintainAspectRatio: false }} />
                </CardContent>
              </Card>
              
              <Card className="border shadow-none">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium">Support Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-64">
                  <Pie data={supportData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 12,
                          font: {
                            size: 10
                          }
                        }
                      }
                    }
                  }} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <Card className="border shadow-none">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-medium">Classification Report</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">Class</TableHead>
                        <TableHead>Precision</TableHead>
                        <TableHead>Recall</TableHead>
                        <TableHead>F1-Score</TableHead>
                        <TableHead>Support</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classNames.map(cls => (
                        <TableRow key={cls}>
                          <TableCell className="font-medium">{cls}</TableCell>
                          <TableCell className="font-mono">{classification_report[cls].precision.toFixed(3)}</TableCell>
                          <TableCell className="font-mono">{classification_report[cls].recall.toFixed(3)}</TableCell>
                          <TableCell className="font-mono">{classification_report[cls]['f1-score']?.toFixed(3)}</TableCell>
                          <TableCell className="font-mono">{classification_report[cls].support}</TableCell>
                        </TableRow>
                      ))}
                      
                   
                      
                      <TableRow>
                        <TableCell className="font-medium">Macro Avg</TableCell>
                        <TableCell className="font-mono">{classification_report['macro avg'].precision.toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['macro avg'].recall.toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['macro avg']['f1-score']?.toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['macro avg'].support}</TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell className="font-medium">Weighted Avg</TableCell>
                        <TableCell className="font-mono">{classification_report['weighted avg'].precision.toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['weighted avg'].recall.toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['weighted avg']['f1-score'].toFixed(3)}</TableCell>
                        <TableCell className="font-mono">{classification_report['weighted avg'].support}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelPerformance;