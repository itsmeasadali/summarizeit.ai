'use server'

import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

interface Review {
  text: string;
}

interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
}

export async function parseCSV(csvContent: string, columnName: string): Promise<Review[]> {
  const records = parse(csvContent, { columns: true });
  return records.map((record: Record<string, string>) => ({
    text: record[columnName] || '',
  }));
}

export async function summarizeReviews(reviews: Review[]): Promise<string> {
  const reviewTexts = reviews.map(review => review.text).join('\n');
  const prompt = `Summarize the following reviews:\n\n${reviewTexts}\n\nSummary:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error('Error in summarizeReviews:', error);
    return "An error occurred while generating the summary.";
  }
}

export async function getKeyPoints(reviews: Review[]): Promise<string[]> {
  const reviewTexts = reviews.map(review => review.text).join('\n');
  const prompt = `Extract the key points from these reviews:\n\n${reviewTexts}\n\nKey points:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const keyPointsText = response.choices[0].message.content || "";
    return keyPointsText.split('\n').filter(point => point.trim() !== '');
  } catch (error) {
    console.error('Error in getKeyPoints:', error);
    return ["An error occurred while extracting key points."];
  }
}

export async function getRecommendations(reviews: Review[]): Promise<string[]> {
  const reviewTexts = reviews.map(review => review.text).join('\n');
  const prompt = `Based on these reviews, provide recommendations:\n\n${reviewTexts}\n\nRecommendations:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const recommendationsText = response.choices[0].message.content || "";
    return recommendationsText.split('\n').filter(recommendation => recommendation.trim() !== '');
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return ["An error occurred while generating recommendations."];
  }
}

export async function getOwnerRecommendations(reviews: Review[]): Promise<string[]> {
  const reviewTexts = reviews.map(review => review.text).join('\n');
  const prompt = `Based on these reviews, provide recommendations for the product/service owner on how they can improve:\n\n${reviewTexts}\n\nOwner Recommendations:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const ownerRecommendationsText = response.choices[0].message.content || "";
    return ownerRecommendationsText.split('\n').filter(recommendation => recommendation.trim() !== '');
  } catch (error) {
    console.error('Error in getOwnerRecommendations:', error);
    return ["An error occurred while generating owner recommendations."];
  }
}

export async function analyzeSentiment(reviews: Review[]): Promise<SentimentAnalysis> {
  const reviewTexts = reviews.map(review => review.text).join('\n');
  const prompt = `Analyze the sentiment of the following reviews. Provide the percentage of positive, neutral, and negative sentiments. Only return the percentages as numbers, separated by commas in the order: positive,neutral,negative.\n\n${reviewTexts}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
    });

    const result = response.choices[0].message.content;
    if (result) {
      const [positive, neutral, negative] = result.split(',').map(Number);
      return { positive, neutral, negative };
    }
    throw new Error('Failed to parse sentiment analysis result');
  } catch (error) {
    console.error('Error in analyzeSentiment:', error);
    return { positive: 0, neutral: 0, negative: 0 };
  }
}