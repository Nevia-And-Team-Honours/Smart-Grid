/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import DatasetSummary from "./DatasetSummary";
import SampleDataTable from "./SampleDataTable";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

ChartJS.register(ArcElement, Tooltip, Legend);

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
        const response = await fetch("http://localhost:5000/api/dataset-info");
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
          "http://localhost:5000/api/sample-data?limit=5"
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
        const response = await fetch("http://localhost:5000/api/datasets");
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

      const response = await fetch("http://localhost:5000/api/upload-dataset", {
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
      
      const response = await fetch("http://localhost:5000/api/switch-dataset", {
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
                    <Check className="h-4 w-4 text-green-600" />
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <Card className="border border-gray-200">
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
    </div>
  );
};

export default Dashboard;