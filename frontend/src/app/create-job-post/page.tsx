'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateJobPost() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    // Insert into Supabase
    const { data, error: supabaseError } = await supabase
      .from('job_posts')
      .insert([
        {
          job_title: title,
          job_description: description,
          // user_id and created_at are set automatically
        }
      ]);

    if (supabaseError) {
      setError('Failed to create job post: ' + supabaseError.message);
      return;
    }

    setSuccess('Job post created!');
    setTitle('');
    setDescription('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Job Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter job title"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Job Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter job description"
              rows={6}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Job Post
          </button>
        </form>
      </div>
    </div>
  );
} 