import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Loading from '../components/Loading';
import Navigation from '../components/Navigation';
import FeatureImportance from '../components/FeatureImportance';
import CorrelationMatrix from '../components/CorrelationMatrix';
import ModelPerformance from '../components/ModelPerformance';
import Footer from '../components/Footer';

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
          fetch('http://localhost:5000/api/correlations'),
          fetch('http://localhost:5000/api/feature-importance'),
          fetch('http://localhost:5000/api/model-performance')
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Analysis - Smart Grid Stability</title>
        <meta name="description" content="Detailed analysis of smart grid stability data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Smart Grid Analysis
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {correlationData && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <CorrelationMatrix correlationData={correlationData} />
            </div>
          )}

          {featureImportance && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <FeatureImportance featureImportance={featureImportance} />
            </div>
          )}

          {modelPerformance && (
            <div className="col-span-1 md:col-span-2 bg-white shadow-md rounded-lg p-6">
              <ModelPerformance modelPerformance={modelPerformance} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Analysis;