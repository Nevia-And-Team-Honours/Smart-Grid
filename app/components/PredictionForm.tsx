"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const PredictionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    tau1: 8.0,
    tau2: 8.0,
    tau3: 8.0,
    tau4: 8.0,
    p1: 0.5,
    p2: 0.5,
    p3: 0.5,
    p4: 0.5,
    g1: 0.1,
    g2: 0.1,
    g3: 0.1,
    g4: 0.1
  });
  
  interface Prediction {
    prediction: string;
    probabilities: Record<string, number>;
  }

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value)
    });
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData({
      ...formData,
      [name]: value[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPrediction(data);
      } else {
        setError(data.error || 'Failed to make prediction');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error making prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const parameterSections = [
    {
      title: "Time Constants",
      description: "Time constants of first order system",
      params: [
        { name: "tau1", label: "τ₁", min: 0.1, max: 20, step: 0.1 },
        { name: "tau2", label: "τ₂", min: 0.1, max: 20, step: 0.1 },
        { name: "tau3", label: "τ₃", min: 0.1, max: 20, step: 0.1 },
        { name: "tau4", label: "τ₄", min: 0.1, max: 20, step: 0.1 },
      ]
    },
    {
      title: "Gain Values",
      description: "Gain parameters of the system",
      params: [
        { name: "p1", label: "p₁", min: 0, max: 1, step: 0.01 },
        { name: "p2", label: "p₂", min: 0, max: 1, step: 0.01 },
        { name: "p3", label: "p₃", min: 0, max: 1, step: 0.01 },
        { name: "p4", label: "p₄", min: 0, max: 1, step: 0.01 },
      ]
    },
    {
      title: "Load Parameters",
      description: "Grid loading parameters",
      params: [
        { name: "g1", label: "g₁", min: 0, max: 1, step: 0.01 },
        { name: "g2", label: "g₂", min: 0, max: 1, step: 0.01 },
        { name: "g3", label: "g₃", min: 0, max: 1, step: 0.01 },
        { name: "g4", label: "g₄", min: 0, max: 1, step: 0.01 },
      ]
    }
  ];

  return (
    <form onSubmit={handleSubmit}>
      {parameterSections.map((section, idx) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={param.name} className="text-sm font-medium">
                      {param.label}
                    </Label>
                    <span className="text-sm text-gray-500">
                      {formData[param.name as keyof typeof formData]}
                    </span>
                  </div>
                  <Slider
                    id={param.name}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={[formData[param.name as keyof typeof formData]]}
                    onValueChange={(value) => handleSliderChange(param.name, value)}
                    className="py-2"
                  />
                  <Input
                    type="number"
                    id={param.name}
                    name={param.name}
                    value={formData[param.name as keyof typeof formData]}
                    onChange={handleChange}
                    step={param.step}
                    min={param.min}
                    max={param.max}
                    className="h-8 mt-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? 'Processing...' : 'Predict Grid Stability'}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {prediction && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>Smart grid stability analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Predicted Class:</span>
              <span className={`text-lg font-bold ${prediction.prediction === 'stable' ? 'text-emerald-600' : 'text-red-600'}`}>
                {prediction.prediction.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">Class Probabilities</h4>
              {Object.entries(prediction.probabilities).map(([className, probability]: [string, number]) => (
                <div key={className} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{className.charAt(0).toUpperCase() + className.slice(1)}</span>
                    <span className="font-medium">{(probability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={probability * 100} 
                
                    className={`${className === 'stable' ? 'bg-emerald-600' : 'bg-red-600'}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
};

export default PredictionForm;