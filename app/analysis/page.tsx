"use client"
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Loading from '../components/Loading';
import Navigation from '../components/Navigation';
import FeatureImportance from '../components/FeatureImportance';
import CorrelationMatrix from '../components/CorrelationMatrix';
import ModelPerformance from '../components/ModelPerformance';
import Footer from '../components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const Analysis: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [correlationData, setCorrelationData] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [modelPerformance, setModelPerformance] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [corrResponse, featureResponse, perfResponse] = await Promise.all([
          fetch('https://smart-grid-backend-production.up.railway.app/api/correlations'),
          fetch('https://smart-grid-backend-production.up.railway.app/api/feature-importance'),
          fetch('https://smart-grid-backend-production.up.railway.app/api/model-performance')
        ]);

        const corrData = await corrResponse.json();
        const featureData = await featureResponse.json();
        const perfData = await perfResponse.json();

        setCorrelationData(corrData);
        setFeatureImportance(featureData);
        setModelPerformance(perfData);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Head>
        <title>Analysis - Smart Grid Stability</title>
        <meta name="description" content="Detailed analysis of smart grid stability data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Smart Grid Analysis
          </h1>
          <p className="text-gray-500">
            Comprehensive analysis of feature relationships and model performance
          </p>
        </div>

        <Tabs defaultValue="relationships" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="relationships">Feature Relationships</TabsTrigger>
            <TabsTrigger value="performance">Model Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="relationships" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {correlationData && (
                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    <CorrelationMatrix correlationData={correlationData} />
                  </CardContent>
                </Card>
              )}

              {featureImportance && (
                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    <FeatureImportance featureImportance={featureImportance} />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            {modelPerformance && (
              <ModelPerformance modelPerformance={modelPerformance} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Separator />
      <Footer />
    </div>
  );
};

export default Analysis;