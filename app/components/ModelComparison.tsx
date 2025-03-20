import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart4, CheckCircle2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelPerformance {
  accuracy: number;
  classification_report: {
    [className: string]: {
      precision: number;
      recall: number;
      "f1-score": number;  // Fixed: Using quotes for property name with hyphen
      support: number;
    };
  };
  model_type: string;
}

interface ModelComparisonData {
  model_comparison: {
    [modelType: string]: {
      accuracy: number;
      classification_report: {
        [className: string]: {
          precision: number;
          recall: number;
          "f1-score": number;  // Fixed: Using quotes for property name with hyphen
          support: number;
        };
      };
    };
  };
}

const ModelComparison: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [comparisonData, setComparisonData] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switchingModel, setSwitchingModel] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("performance");

  // Format model name for display
  const formatModelName = (name: string): string => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        setAvailableModels(data.models || []);
        setCurrentModel(data.current_model || "");
      } catch (error) {
        console.error("Error fetching models:", error);
        setError("Failed to load available models");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Fetch current model performance
  useEffect(() => {
    const fetchModelPerformance = async () => {
      if (!currentModel) return;
      
      try {
        setLoading(true);
        const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/model-performance");
        if (!response.ok) {
          throw new Error("Failed to fetch model performance");
        }
        const data = await response.json();
        setModelPerformance(data);
      } catch (error) {
        console.error("Error fetching model performance:", error);
        setError("Failed to load model performance metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchModelPerformance();
  }, [currentModel]);

  // Handle model switching
  const handleModelChange = async (value: string) => {
    try {
      setSwitchingModel(true);
      setError("");
      
      const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/switch-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to switch model");
      }

      setCurrentModel(value);
    } catch (error) {
      console.error("Error switching model:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setSwitchingModel(false);
    }
  };

  // Compare all models
  const handleCompareModels = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/compare-models");
      if (!response.ok) {
        throw new Error("Failed to compare models");
      }
      
      const data = await response.json();
      setComparisonData(data);
      setActiveTab("comparison");
    } catch (error) {
      console.error("Error comparing models:", error);
      setError(error instanceof Error ? error.message : "Failed to compare models");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for model comparison
  const getComparisonChartData = () => {
    if (!comparisonData) return null;

    const labels = Object.keys(comparisonData.model_comparison).map(formatModelName);
    const accuracyData = Object.values(comparisonData.model_comparison).map(model => model.accuracy * 100);

    // Get class names from first model
    const firstModelKey = Object.keys(comparisonData.model_comparison)[0];
    const firstModel = comparisonData.model_comparison[firstModelKey];
    const classNames = Object.keys(firstModel.classification_report).filter(
      name => !['accuracy', 'macro avg', 'weighted avg'].includes(name)
    );

    // Calculate F1 scores for each class and model
    const datasets = classNames.map((className, index) => {
      const data = Object.keys(comparisonData.model_comparison).map(modelType => 
        comparisonData.model_comparison[modelType].classification_report[className]?.['f1-score'] * 100 || 0
      );

      // Color palette
      const colors = [
        'rgba(53, 162, 235, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(255, 99, 132, 0.7)',
      ];

      return {
        label: `F1 Score - ${className}`,
        data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.7', '1'),
        borderWidth: 1,
      };
    });

    // Add accuracy dataset
    datasets.unshift({
      label: 'Accuracy',
      data: accuracyData,
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    });

    return {
      labels,
      datasets,
    };
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-6 bg-gray-50 text-black">
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Model Selection</CardTitle>
          <CardDescription>Choose a machine learning model or compare all models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">Current Model</label>
                <Select
                  value={currentModel}
                  onValueChange={handleModelChange}
                  disabled={loading || switchingModel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {formatModelName(model)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentModel && (
                <div className="px-4 py-3 bg-blue-50 text-blue-800 rounded-md flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span>Active model: <strong>{formatModelName(currentModel)}</strong></span>
                </div>
              )}
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleCompareModels} 
                disabled={loading || switchingModel}
                className="w-full flex items-center justify-center space-x-2"
              >
                <BarChart4 className="h-5 w-5" />
                <span>Compare All Models</span>
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="performance">Current Model Performance</TabsTrigger>
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-medium">
                {currentModel ? `${formatModelName(currentModel)} Performance` : "Model Performance"}
              </CardTitle>
              <CardDescription>Accuracy and classification metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : modelPerformance ? (
                <div className="space-y-6">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-sm font-medium text-gray-500">Overall Accuracy</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {(modelPerformance.accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Classification Report</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>Performance metrics for {formatModelName(currentModel)}</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Class</TableHead>
                            <TableHead>Precision</TableHead>
                            <TableHead>Recall</TableHead>
                            <TableHead>F1 Score</TableHead>
                            <TableHead>Support</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(modelPerformance.classification_report)
                            .filter(([className]) => !['accuracy', 'macro avg', 'weighted avg'].includes(className))
                            .map(([className, metrics]) => (
                              <TableRow key={className}>
                                <TableCell className="font-medium">{className}</TableCell>
                                <TableCell>{(metrics.precision * 100).toFixed(2)}%</TableCell>
                                <TableCell>{(metrics.recall * 100).toFixed(2)}%</TableCell>
                                <TableCell>{(metrics["f1-score"] * 100).toFixed(2)}%</TableCell>
                                <TableCell>{metrics.support}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No model performance data available. Please select a model.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Model Comparison</CardTitle>
              <CardDescription>Compare performance across all available models</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : comparisonData ? (
                <div className="space-y-6">
                  <div className="h-96">
                    {getComparisonChartData() && (
                      <Bar
                        data={getComparisonChartData()!}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Model Performance Comparison (%)',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                              title: {
                                display: true,
                                text: 'Score (%)'
                              }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Accuracy Comparison</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>Performance comparison across all models</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Accuracy</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(comparisonData.model_comparison)
                            .sort((a, b) => b[1].accuracy - a[1].accuracy)
                            .map(([modelType, metrics]) => (
                              <TableRow key={modelType}>
                                <TableCell className="font-medium">{formatModelName(modelType)}</TableCell>
                                <TableCell>{(metrics.accuracy * 100).toFixed(2)}%</TableCell>
                                <TableCell>
                                  {modelType !== currentModel ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleModelChange(modelType)}
                                      disabled={switchingModel}
                                    >
                                      Activate
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-green-600">Current model</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <BarChart4 className="h-16 w-16 mb-4 text-gray-400" />
                  <p>No comparison data available. Click &qout;Compare All Models&qout; to see performance metrics.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleCompareModels} disabled={loading}>
                Refresh Comparison
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelComparison;