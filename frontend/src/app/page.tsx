'use client'

import { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type TabType = 'home' | 'jobseeker' | 'employer' | 'chat'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const newMessage: ChatMessage = {
      role: 'user',
      content: inputMessage
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          model: 'gemini-2.5-flash'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend is running and your Google API key is configured.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const TabButton = ({ tabKey, label, isActive, onClick }: {
    tabKey: TabType
    label: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
        isActive
          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="text-center py-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              Welcome to Job Connect Hub
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your comprehensive platform for connecting job seekers with employers. 
              Whether you're looking for your next career opportunity or seeking top talent, 
              we've got you covered.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">For Job Seekers</h3>
                <p className="mb-6">
                  Find your dream job with our AI-powered matching system, 
                  resume optimization tools, and interview preparation resources.
                </p>
                <button
                  onClick={() => setActiveTab('jobseeker')}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">For Employers</h3>
                <p className="mb-6">
                  Post jobs, manage applications, and find the perfect candidates 
                  with our advanced recruitment tools and analytics.
                </p>
                <button
                  onClick={() => setActiveTab('employer')}
                  className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Post Jobs
                </button>
              </div>
            </div>

            <div className="mt-12 bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                AI-Powered Career Assistant
              </h3>
              <p className="text-gray-600 mb-6">
                Get instant help with career advice, resume tips, and interview preparation 
                from our advanced AI assistant powered by Google Gemini.
              </p>
              <button
                onClick={() => setActiveTab('chat')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Chatting
              </button>
            </div>
          </div>
        )

      case 'jobseeker':
        return (
          <div className="py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Job Seeker Dashboard</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Resume Builder
                </h3>
                <p className="text-gray-600 mb-4">
                  Create and optimize your resume with AI-powered suggestions and templates.
                </p>
                <button 
                  onClick={() => window.open('/resume-builder', '_blank')}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Build Resume
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Job Search
                </h3>
                <p className="text-gray-600 mb-4">
                  Browse and search for job opportunities that match your skills and preferences.
                </p>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  Search Jobs
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Interview Prep
                </h3>
                <p className="text-gray-600 mb-4">
                  Practice with mock interviews and get tips to ace your next interview.
                </p>
                <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  Start Practice
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Applications
                </h3>
                <p className="text-gray-600 mb-4">
                  Track your job applications and manage your application pipeline.
                </p>
                <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  View Applications
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Profile
                </h3>
                <p className="text-gray-600 mb-4">
                  Manage your profile, skills, and preferences to get better job matches.
                </p>
                <button className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors">
                  Edit Profile
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Analytics
                </h3>
                <p className="text-gray-600 mb-4">
                  View insights about your job search progress and application performance.
                </p>
                <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )

      case 'employer':
        return (
          <div className="py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Employer Dashboard</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Post New Job
                </h3>
                <p className="text-gray-600 mb-4">
                  Create and publish new job postings to attract top talent.
                </p>
                <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
                  Create Job Post
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Manage Jobs
                </h3>
                <p className="text-gray-600 mb-4">
                  View, edit, and manage your existing job postings and their status.
                </p>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  View Jobs
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Applications
                </h3>
                <p className="text-gray-600 mb-4">
                  Review and manage applications received for your job postings.
                </p>
                <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  Review Applications
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Candidate Search
                </h3>
                <p className="text-gray-600 mb-4">
                  Search and browse profiles of potential candidates for your roles.
                </p>
                <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Search Candidates
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Company Profile
                </h3>
                <p className="text-gray-600 mb-4">
                  Manage your company profile and branding to attract better candidates.
                </p>
                <button className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors">
                  Edit Profile
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Recruitment Analytics
                </h3>
                <p className="text-gray-600 mb-4">
                  Track hiring metrics and analyze your recruitment performance.
                </p>
                <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )

      case 'chat':
        return (
          <div className="py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">AI Career Assistant</h2>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Chat with AI Assistant
                </h3>
                
                {/* Chat Messages */}
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-lg">Welcome! Ask me anything about careers, job searching, or professional development.</p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-800 border'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="text-left mb-4">
                      <div className="inline-block p-3 rounded-lg bg-white text-gray-800 border">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about careers, job search, resume tips..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            {/* Chat Features */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Career Guidance
                </h4>
                <p className="text-gray-600">
                  Get personalized career advice and explore different career paths that match your skills and interests.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Resume Help
                </h4>
                <p className="text-gray-600">
                  Improve your resume with AI-powered suggestions and tips to make it stand out to employers.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Interview Prep
                </h4>
                <p className="text-gray-600">
                  Practice common interview questions and get tips on how to present yourself confidently.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Tab not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Job Connect Hub</h1>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-100 border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <TabButton
              tabKey="home"
              label="Home"
              isActive={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
            />
            <TabButton
              tabKey="jobseeker"
              label="Job Seeker Dashboard"
              isActive={activeTab === 'jobseeker'}
              onClick={() => setActiveTab('jobseeker')}
            />
            <TabButton
              tabKey="employer"
              label="Employer Dashboard"
              isActive={activeTab === 'employer'}
              onClick={() => setActiveTab('employer')}
            />
            <TabButton
              tabKey="chat"
              label="Chat"
              isActive={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </main>
    </div>
  )
}
