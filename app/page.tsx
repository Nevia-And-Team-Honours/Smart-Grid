"use client"
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Loading from './components/Loading';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

const Home: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [datasetInfo, setDatasetInfo] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dataset-info');
        const data = await response.json();
        setDatasetInfo(data);
      } catch (error) {
        console.error('Error fetching dataset info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <Head>
        <title>Smart Grid Stability Analysis</title>
        <meta name="description" content="Smart Grid Stability Analysis Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Smart Grid Stability Analysis
        </h1>

        {datasetInfo && <Dashboard datasetInfo={datasetInfo} />}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
