'use client'

import React, { useState } from 'react';
import { parseCSV, summarizeReviews, getKeyPoints, getRecommendations, getOwnerRecommendations, analyzeSentiment } from '../actions/reviewActions';
import styles from './ReviewManager.module.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Review {
  text: string;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  ownerRecommendations: string[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

export default function ReviewManager() {
  const [reviews, setReviews] = useState<Review[]>([{ text: '' }]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showCsvMapping, setShowCsvMapping] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const handleAddReview = () => {
    setReviews([...reviews, { text: '' }]);
  };

  const handleReviewChange = (index: number, value: string) => {
    const updatedReviews = reviews.map((review, i) => 
      i === index ? { ...review, text: value } : review
    );
    setReviews(updatedReviews);
  };

  const handleRemoveReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    const filteredReviews = reviews.filter(review => review.text.trim() !== '');
    try {
      const [summary, keyPoints, recommendations, ownerRecommendations, sentimentAnalysis] = await Promise.all([
        summarizeReviews(filteredReviews),
        getKeyPoints(filteredReviews),
        getRecommendations(filteredReviews),
        getOwnerRecommendations(filteredReviews),
        analyzeSentiment(filteredReviews)
      ]);
      setAnalysisResult({ summary, keyPoints, recommendations, ownerRecommendations });
      
      // Generate chart data from sentiment analysis
      setChartData({
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          label: 'Sentiment Analysis',
          data: [sentimentAnalysis.positive, sentimentAnalysis.neutral, sentimentAnalysis.negative],
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
        }]
      });
    } catch (error) {
      console.error('Error during analysis:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      setCsvContent(content);
      const firstLine = content.split('\n')[0];
      const columns = firstLine.split(',').map(col => col.trim());
      setCsvColumns(columns);
      setShowCsvMapping(true);
    }
  };

  const handleCsvMapping = async () => {
    if (selectedColumn) {
      const parsedReviews = await parseCSV(csvContent, selectedColumn);
      setReviews(parsedReviews);
      setShowCsvMapping(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerContainer}>
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoPlaceholder}></div>
            <h1 className={styles.logoText}>Summarizeit.ai</h1>
          </div>
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>Home</a>
            <a href="#" className={styles.navLink}>About</a>
            <a href="#" className={styles.navLink}>Contact</a>
          </nav>
        </header>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.reviewManagerBox}>
          <div className={styles.actions}>
            <button onClick={handleAddReview} className={styles.button}>Add Review</button>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCsvUpload} 
              className={styles.fileInput} 
              id="csvUpload"
            />
            <label htmlFor="csvUpload" className={styles.button}>Upload CSV</label>
          </div>

          <div className={styles.reviewList}>
            {reviews.map((review, index) => (
              <div key={index} className={styles.reviewItem}>
                <textarea
                  value={review.text}
                  onChange={(e) => handleReviewChange(index, e.target.value)}
                  placeholder="Enter review text"
                  className={styles.textarea}
                  rows={3}
                />
                <button onClick={() => handleRemoveReview(index)} className={styles.removeButton}>
                  &times;
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSubmit} 
            className={`${styles.submitButton} ${isAnalyzing ? styles.busy : ''}`}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Reviews'}
          </button>

          {showCsvMapping && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>Select Review Column</h3>
                <select 
                  value={selectedColumn} 
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select a column</option>
                  {csvColumns.map((column, index) => (
                    <option key={index} value={column}>{column}</option>
                  ))}
                </select>
                <div className={styles.modalActions}>
                  <button onClick={() => setShowCsvMapping(false)} className={styles.button}>
                    Cancel
                  </button>
                  <button onClick={handleCsvMapping} className={styles.button}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className={styles.analysisResult}>
              <div className={styles.summary}>
                <h2 className={styles.sectionTitle}>Summary</h2>
                <p>{analysisResult.summary}</p>
              </div>
              <div className={styles.keyPoints}>
                <h2 className={styles.sectionTitle}>Key Points</h2>
                <ul>
                  {analysisResult.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.recommendations}>
                <h2 className={styles.sectionTitle}>Customer Recommendations</h2>
                <ul>
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
                {chartData && (
                  <div className={styles.chart}>
                    <Bar data={chartData} options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: 'Sentiment Analysis',
                        },
                      },
                    }} />
                  </div>
                )}
              </div>
              <div className={styles.ownerRecommendations}>
                <h2 className={styles.sectionTitle}>Owner Recommendations</h2>
                <ul>
                  {analysisResult.ownerRecommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}