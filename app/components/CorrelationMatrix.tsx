import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define proper types for the correlation data
interface CorrelationMatrix {
  [key: string]: { [key: string]: number };
}

interface StabCorrelations {
  [key: string]: number;
}

interface ProcessedData {
  correlation_matrix: CorrelationMatrix;
  stab_correlations: StabCorrelations;
  features: string[];
  allFeatures: string[];
  sortedStabFeatures: string[];
}

interface CorrelationData {
  correlation_matrix?: CorrelationMatrix;
  stab_correlations?: StabCorrelations;
  [key: string]: CorrelationMatrix | StabCorrelations | undefined;
}

interface CorrelationMatrixProps {
  correlationData: CorrelationData;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  correlationData,
}) => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("Raw Correlation Data:", correlationData);

    try {
      // Try to process the data regardless of its exact structure
      let matrix: CorrelationMatrix = {};
      let stabCorr: StabCorrelations = {};
      let features: string[] = [];

      // Check the structure of correlationData and extract data accordingly
      if (correlationData) {
        // Case 1: Expected structure
        if (
          correlationData.correlation_matrix &&
          correlationData.stab_correlations
        ) {
          matrix = correlationData.correlation_matrix;
          stabCorr = correlationData.stab_correlations;
        }
        // Case 2: Data might be directly in the correlationData object
        else if (typeof correlationData === "object") {
          // See if we can find anything that looks like correlation data
          const keys = Object.keys(correlationData);

          // Look for correlation matrix (should be an object with nested objects)
          const matrixKey = keys.find(
            (key) =>
              typeof correlationData[key] === "object" &&
              correlationData[key] !== null &&
              Object.keys(correlationData[key] || {}).length > 0 &&
              typeof correlationData[key][
                Object.keys(correlationData[key] || {})[0]
              ] === "object"
          );

          if (matrixKey) {
            matrix = correlationData[matrixKey] as CorrelationMatrix;
          }

          // Look for stab correlations (should be an object with number values)
          const stabKey = keys.find(
            (key) =>
              typeof correlationData[key] === "object" &&
              correlationData[key] !== null &&
              Object.keys(correlationData[key] || {}).length > 0 &&
              typeof correlationData[key][
                Object.keys(correlationData[key] || {})[0]
              ] === "number"
          );

          if (stabKey) {
            stabCorr = correlationData[stabKey] as StabCorrelations;
          }
        }
      }

      // Extract features from the data we have
      if (Object.keys(stabCorr).length > 0) {
        features = Object.keys(stabCorr).filter((f) => f !== "stab");
      } else if (Object.keys(matrix).length > 0) {
        // If we don't have stab_correlations, try to extract features from matrix
        const firstKey = Object.keys(matrix)[0];
        if (firstKey && matrix[firstKey]) {
          features = Object.keys(matrix[firstKey]).filter((f) => f !== "stab");
        }
      }

      // If we don't have stab correlations but have a matrix, we can create them
      if (
        Object.keys(stabCorr).length === 0 &&
        Object.keys(matrix).length > 0 &&
        matrix["stab"]
      ) {
        features.forEach((feature) => {
          if (matrix["stab"]) {
            stabCorr[feature] = matrix["stab"][feature] || 0;
          }
        });
      }

      // If we still have no features, we can't proceed
      if (features.length === 0) {
        setErrorMessage("Could not extract feature information from the data");
        setProcessedData(null);
        return;
      }

      // Sort features by correlation strength
      const sortedStabFeatures = [...features].sort(
        (a, b) => Math.abs(stabCorr[b] || 0) - Math.abs(stabCorr[a] || 0)
      );

      // All features for display
      const allFeatures = ["stab", ...features];

      setProcessedData({
        correlation_matrix: matrix,
        stab_correlations: stabCorr,
        features,
        allFeatures,
        sortedStabFeatures,
      });

      setErrorMessage(null);
    } catch (error) {
      console.error("Error processing correlation data:", error);
      setErrorMessage("Error processing correlation data");
      setProcessedData(null);
    }
  }, [correlationData]);

  // Show loading or error state
  if (errorMessage || !processedData) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">
            Feature Correlations
          </CardTitle>
          <CardDescription>
            {errorMessage || "Processing correlation data..."}
          </CardDescription>
        </CardHeader>
        {errorMessage && (
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage}. Please check the console for more details.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    );
  }

  // For stab correlations chart
  const stabData = {
    labels: processedData.sortedStabFeatures,
    datasets: [
      {
        label: "Correlation with Stability",
        data: processedData.sortedStabFeatures.map(
          (f) => processedData.stab_correlations[f] || 0
        ),
        backgroundColor: processedData.sortedStabFeatures.map((f) =>
          (processedData.stab_correlations[f] || 0) >= 0
            ? "rgba(53, 162, 235, 0.7)"
            : "rgba(255, 99, 132, 0.7)"
        ),
        borderColor: processedData.sortedStabFeatures.map((f) =>
          (processedData.stab_correlations[f] || 0) >= 0
            ? "rgba(53, 162, 235, 1)"
            : "rgba(255, 99, 132, 1)"
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">
          Feature Correlations
        </CardTitle>
        <CardDescription>
          Correlation analysis between features and stability
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="stability" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="stability">Stability Correlations</TabsTrigger>
            <TabsTrigger value="matrix">Correlation Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="stability" className="pt-2">
            <Card className="border shadow-none">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-medium">
                  Correlation with Stability
                </CardTitle>
                <CardDescription className="text-xs">
                  Features ranked by correlation strength with stability
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-96">
                  <Bar
                    data={stabData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return (
                                context.dataset.label +
                                ": " +
                                (context.raw as number).toFixed(3)
                              );
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            color: "rgba(0, 0, 0, 0.05)",
                          },
                        },
                        y: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix">
            <Card className="border shadow-none">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-medium">
                  Correlation Matrix Heatmap
                </CardTitle>
                <CardDescription className="text-xs">
                  Pairwise correlations between all features
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-96 w-full">
                  <div className="min-w-max">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10"></TableHead>
                          {processedData.allFeatures.map((feature) => (
                            <TableHead
                              key={feature}
                              className="text-center py-2 px-3 text-xs font-medium"
                            >
                              {feature}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.allFeatures.map((rowFeature) => (
                          <TableRow key={rowFeature}>
                            <TableCell className="sticky left-0 bg-white z-10 font-medium whitespace-nowrap text-xs">
                              {rowFeature}
                            </TableCell>
                            {processedData.allFeatures.map((colFeature) => {
                              // Handle missing data safely
                              const rowData =
                                processedData.correlation_matrix[rowFeature] ||
                                {};
                              const value = rowData[colFeature] || 0;
                              const absValue = Math.abs(value);
                              const intensity = absValue * 100;
                              let color;

                              if (rowFeature === colFeature) {
                                color = "rgba(0, 0, 0, 0.03)";
                              } else if (value >= 0) {
                                color = `rgba(53, 162, 235, ${intensity}%)`;
                              } else {
                                color = `rgba(255, 99, 132, ${intensity}%)`;
                              }

                              return (
                                <TableCell
                                  key={colFeature}
                                  className="text-center py-2 px-3 text-xs font-mono"
                                  style={{
                                    backgroundColor: color,
                                    color: absValue > 0.5 ? "#fff" : "#000",
                                  }}
                                >
                                  {value.toFixed(2)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
