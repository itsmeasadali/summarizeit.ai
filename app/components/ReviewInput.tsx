'use client'

import React, { useState } from 'react';
import { addManualReview, parseCSV, filterReviews, summarizeReviews } from '../actions/reviewActions';

interface Review {
  text: string;
  rating: number;
}

export default function ReviewInput() {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReview = await addManualReview(text, rating);
    setReviews([...reviews, newReview]);
    setText('');
    setRating(5);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      const parsedReviews = await parseCSV(content);
      setReviews([...reviews, ...parsedReviews]);
    }
  };

  const handleSummarize = async () => {
    const filteredReviews = await filterReviews(reviews);
    const summaryText = await summarizeReviews(filteredReviews);
    setSummary(summaryText);
  };

  return (
    <div>
      <form onSubmit={handleManualSubmit}>
        <textarea value={text} onChange={e => setText(e.target.value)} required />
        <input type="number" value={rating} onChange={e => setRating(Number(e.target.value))} min={1} max={5} required />
        <button type="submit">Add Review</button>
      </form>

      <input type="file" accept=".csv" onChange={handleCSVUpload} />

      <button onClick={handleSummarize}>Summarize Reviews</button>

      <div>
        <h3>Reviews:</h3>
        {reviews.map((review, index) => (
          <div key={index}>{review.text} - Rating: {review.rating}</div>
        ))}
      </div>

      {summary && <div><h3>Summary:</h3>{summary}</div>}
    </div>
  );
}