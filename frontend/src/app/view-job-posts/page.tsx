'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface JobPost {
  job_post_id: string;
  job_title: string;
  job_description: string;
  created_at: string;
  user_id: string;
}

export default function ViewJobPosts() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobPosts();
  }, []);

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      setError('');

      // Debug: Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      const { data, error: supabaseError } = await supabase
        .from('job_posts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        setError('Failed to fetch job posts: ' + supabaseError.message);
        return;
      }

      setJobPosts(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('An error occurred while fetching job posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (job_post_id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this job post? This action cannot be undone.');
    if (!confirmed) return;
    setError('');
    try {
      const { error: supabaseError } = await supabase
        .from('job_posts')
        .delete()
        .eq('job_post_id', job_post_id);
      if (supabaseError) {
        setError('Failed to delete job post: ' + supabaseError.message);
        return;
      }
      setJobPosts(prev => prev.filter(post => post.job_post_id !== job_post_id));
    } catch (err) {
      setError('An error occurred while deleting the job post.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">My Job Posts</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {jobPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Job Posts Yet</h2>
            <p className="text-gray-600 mb-4">You haven't created any job posts yet.</p>
            <button
              onClick={() => window.open('/create-job-post', '_self')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Job Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobPosts.map((jobPost) => (
              <div key={jobPost.job_post_id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">{jobPost.job_title}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(jobPost.created_at)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {jobPost.job_description}
                </p>
                <div className="flex space-x-2">
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium" onClick={() => handleDelete(jobPost.job_post_id)}>
                    Delete
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    View Applications
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 