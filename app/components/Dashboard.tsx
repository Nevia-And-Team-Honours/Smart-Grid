"use client"
import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import Link from "next/link";
import DatasetSummary from "./DatasetSummary";
import SampleDataTable from "./SampleDataTable";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Upload, BarChart4 } from "lucide-react";
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

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ModelPerformance {
  accuracy: number;
  classification_report: {
    [className: string]: {
      precision: number;
      recall: number;
      "f1-score": number;
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
          "f1-score": number;
          support: number;
        };
      };
    };
  };
}

interface DashboardProps {
  datasetInfo: {
    num_rows: number;
    num_columns: number;
    columns: string[];
    class_distribution: { [key: string]: number };
    current_dataset?: string;
  };
}

// Default empty dataset info to prevent null/undefined errors
const defaultDatasetInfo = {
  num_rows: 0,
  num_columns: 0,
  columns: [],
  class_distribution: {},
  current_dataset: ""
};

const Dashboard: React.FC<DashboardProps> = ({ datasetInfo = defaultDatasetInfo }) => {
  // Dataset state
  const [sampleData, setSampleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [currentDataset, setCurrentDataset] = useState(datasetInfo?.current_dataset || "");
  const [refreshDataset, setRefreshDataset] = useState(false);
  const [datasetInfoState, setDatasetInfoState] = useState<DashboardProps["datasetInfo"]>(datasetInfo);
  
  // Model state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [comparisonData, setComparisonData] = useState<ModelComparisonData | null>(null);
  const [switchingModel, setSwitchingModel] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("performance");
  const [activeMainTab, setActiveMainTab] = useState<string>("dataset");

  // Format model name for display
  const formatModelName = (name: string): string => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Load the first dataset automatically if available
  useEffect(() => {
    const loadFirstDataset = async () => {
      try {
        if (availableDatasets.length > 0 && !currentDataset) {
          await handleDatasetChange(availableDatasets[0]);
        }
      } catch (error) {
        console.error("Error loading first dataset:", error);
      }
    };

    loadFirstDataset();
  }, [availableDatasets]);

  // Fetch dataset info when current dataset changes
  useEffect(() => {
    const fetchDatasetInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/dataset-info");
        const data = await response.json();
        setDatasetInfoState(data || defaultDatasetInfo);
      } catch (error) {
        console.error("Error fetching dataset info:", error);
        setDatasetInfoState(defaultDatasetInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetInfo();
  }, [refreshDataset]);

  // Fetch sample data when refreshDataset changes
  useEffect(() => {
    const fetchSampleData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://smart-grid-backend-production.up.railway.app/api/sample-data?limit=5"
        );
        const data = await response.json();
        setSampleData(data.sample || []);
      } catch (error) {
        console.error("Error fetching sample data:", error);
        setSampleData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSampleData();
  }, [refreshDataset]);

  // Fetch available datasets
  useEffect(() => {
    const fetchAvailableDatasets = async () => {
      try {
        const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/datasets");
        const data = await response.json();
        setAvailableDatasets(data.datasets || []);
        
        if (data.current_dataset) {
          setCurrentDataset(data.current_dataset);
        } else if (data.datasets && data.datasets.length > 0) {
          // Auto-select first dataset if none is currently selected
          setCurrentDataset(data.datasets[0]);
          handleDatasetChange(data.datasets[0]);
        }
      } catch (error) {
        console.error("Error fetching available datasets:", error);
        setAvailableDatasets([]);
      }
    };

    fetchAvailableDatasets();
  }, [refreshDataset]);

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
        setModelError("Failed to load available models");
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
        setModelError("Failed to load model performance metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchModelPerformance();
  }, [currentModel]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setUploadError("Please upload a CSV file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError("");

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/upload-dataset", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload dataset");
      }

      const data = await response.json();
      console.log("Uploaded dataset:", data);
      setUploadSuccess(true);
      setRefreshDataset(prev => !prev); // Toggle to refresh data
      
      // Reset the file input
      event.target.value = "";
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError("An unknown error occurred");
      }
    } finally {
      setUploading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  const handleDatasetChange = async (value: string) => {
    try {
      setLoading(true);
      
      const response = await fetch("https://smart-grid-backend-production.up.railway.app:/api/switch-dataset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataset: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to switch dataset");
      }

      setCurrentDataset(value);
      setRefreshDataset(prev => !prev); // Toggle to refresh data
    } catch (error) {
      console.error("Error switching dataset:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle model switching
  const handleModelChange = async (value: string) => {
    try {
      setSwitchingModel(true);
      setModelError("");
      
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
      setModelError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setSwitchingModel(false);
    }
  };

  // Compare all models
  const handleCompareModels = async () => {
    try {
      setLoading(true);
      setModelError("");
      
      const response = await fetch("https://smart-grid-backend-production.up.railway.app/api/compare-models");
      if (!response.ok) {
        throw new Error("Failed to compare models");
      }
      
      const data = await response.json();
      setComparisonData(data);
      setActiveTab("comparison");
    } catch (error) {
      console.error("Error comparing models:", error);
      setModelError(error instanceof Error ? error.message : "Failed to compare models");
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

  // Ensure we have a valid class_distribution object
  const classDistribution = datasetInfoState?.class_distribution || {};

  const classDistributionData = {
    labels: Object.keys(classDistribution),
    datasets: [
      {
        label: "Class Distribution",
        data: Object.values(classDistribution),
        backgroundColor: [
          "rgba(53, 162, 235, 0.7)",  // Blue
          "rgba(75, 192, 192, 0.7)",  // Teal
          "rgba(153, 102, 255, 0.7)", // Purple
          "rgba(255, 159, 64, 0.7)",  // Orange
          "rgba(255, 99, 132, 0.7)",  // Pink
          "rgba(54, 162, 235, 0.7)",  // Light blue
        ],
        borderColor: [
          "rgba(53, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-6 bg-gray-50 text-black">
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dataset">Dataset Management</TabsTrigger>
          <TabsTrigger value="model">Model Selection</TabsTrigger>
        </TabsList>
        
        {/* Dataset Management Tab */}
        <TabsContent value="dataset">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Dataset Management</CardTitle>
              <CardDescription>Upload a new dataset or switch between existing datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="switch" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="switch">Switch Dataset</TabsTrigger>
                  <TabsTrigger value="upload">Upload Dataset</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      <Button disabled={uploading} className="flex items-center space-x-2">
                        <Upload size={16} />
                        <span>Upload</span>
                      </Button>
                    </div>
                    
                    {uploading && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Uploading dataset...</div>
                        <Progress value={uploadProgress} className="w-full h-2" />
                      </div>
                    )}
                    
                    {uploadSuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Success</AlertTitle>
                        <AlertDescription className="text-green-700">
                          Dataset uploaded and processed successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {uploadError && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">Error</AlertTitle>
                        <AlertDescription className="text-red-700">
                          {uploadError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="switch" className="space-y-4">
                  <div className="flex flex-col space-y-4">
                    {availableDatasets.length > 0 ? (
                      <>
                        <Select 
                          value={currentDataset} 
                          onValueChange={handleDatasetChange}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDatasets.map((dataset) => (
                              <SelectItem key={dataset} value={dataset}>
                                {dataset}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="text-sm text-gray-500">
                          Current dataset: <span className="font-medium">{currentDataset || "None selected"}</span>
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No datasets available</AlertTitle>
                        <AlertDescription>
                          Please upload a dataset using the Upload tab
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="border border-gray-200 text-black">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Dataset Overview</CardTitle>
                <CardDescription>Summary statistics and feature information</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <DatasetSummary datasetInfo={datasetInfoState} />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/analysis">View Detailed Analysis</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Class Distribution</CardTitle>
                <CardDescription>Distribution of target classes in the dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full rounded-md" />
                    </div>
                  ) : Object.keys(classDistribution).length > 0 ? (
                    <Doughnut
                      data={classDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12,
                              padding: 16,
                              font: {
                                size: 12
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No categorical target variable detected or not enough distinct classes
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/prediction">Make Predictions</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="border border-gray-200 mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Sample Data</CardTitle>
              <CardDescription>Preview of dataset records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : sampleData?.length > 0 ? (
                <SampleDataTable data={sampleData} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available. Please upload or select a valid dataset.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Model Selection Tab */}
        <TabsContent value="model">
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
              
              {modelError && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-red-700">{modelError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
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
                            <TableCaption>Accuracy comparison for all models</TableCaption>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Model</TableHead>
                                <TableHead>Accuracy</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(comparisonData.model_comparison).map(([modelType, modelData]) => (
                                <TableRow key={modelType}>
                                  <TableCell>{formatModelName(modelType)}</TableCell>
                                  <TableCell>{(modelData.accuracy * 100).toFixed(2)}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No model comparison data available. Please compare models.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;