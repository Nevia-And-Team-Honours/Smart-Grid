"use client"
import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import PredictionForm from '../components/PredictionForm';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';


const Prediction: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Make Predictions - Smart Grid Stability</title>
        <meta name="description" content="Make stability predictions for smart grid parameters" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Predict Grid Stability
        </h1>

        <div className="bg-white shadow-md rounded-lg p-6">
          <PredictionForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Prediction;