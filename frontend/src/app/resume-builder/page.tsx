'use client'

import { useState } from 'react'

interface ResumeSection {
  id: string
  title: string
  content: string
  isEditing: boolean
}

export default function ResumeBuilder() {
  const [resumeTitle, setResumeTitle] = useState('My Resume')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [sections, setSections] = useState<ResumeSection[]>([
    {
      id: '1',
      title: 'Personal Information',
      content: 'Full Name: [Your Name]\nEmail: [your.email@example.com]\nPhone: [Your Phone Number]\nLocation: [Your City, State]',
      isEditing: false
    },
    {
      id: '2',
      title: 'Professional Summary',
      content: '[Write a brief 2-3 sentence summary of your professional background and key strengths]',
      isEditing: false
    },
    {
      id: '3',
      title: 'Work Experience',
      content: 'Job Title | Company Name | Dates\n• [Achievement or responsibility]\n• [Achievement or responsibility]\n• [Achievement or responsibility]',
      isEditing: false
    },
    {
      id: '4',
      title: 'Education',
      content: 'Degree | Institution | Graduation Year\n• Relevant coursework or achievements',
      isEditing: false
    },
    {
      id: '5',
      title: 'Skills',
      content: '• Technical Skills: [List your technical skills]\n• Soft Skills: [List your soft skills]\n• Languages: [List languages you speak]',
      isEditing: false
    }
  ])

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Consider quantifying your achievements with specific numbers",
    "Use action verbs to start each bullet point",
    "Tailor your skills section to match the job description"
  ])

  const toggleSectionEdit = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, isEditing: !section.isEditing }
        : section
    ))
  }

  const updateSectionContent = (sectionId: string, newContent: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, content: newContent }
        : section
    ))
  }

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, title: newTitle }
        : section
    ))
  }

  const addNewSection = () => {
    const newSection: ResumeSection = {
      id: Date.now().toString(),
      title: 'New Section',
      content: '[Add your content here]',
      isEditing: true
    }
    setSections([...sections, newSection])
  }

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId))
  }

  const generateAISuggestion = async () => {
    // This would connect to your backend AI service
    // For now, showing a placeholder
    const suggestions = [
      "Try using more specific action verbs like 'spearheaded', 'optimized', or 'implemented'",
      "Consider adding metrics to quantify your impact (e.g., 'increased sales by 25%')",
      "Make sure to highlight transferable skills relevant to your target role"
    ]
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    setAiSuggestions(prev => [randomSuggestion, ...prev.slice(0, 4)])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.close()}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {resumeTitle}
                </h1>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                Preview
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                Download PDF
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Resume
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg">
              
              {/* Toolbar */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                    <option>Modern Template</option>
                    <option>Classic Template</option>
                    <option>Creative Template</option>
                    <option>Minimal Template</option>
                  </select>
                  
                  <div className="h-4 w-px bg-gray-300"></div>
                  
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
                    <strong>B</strong>
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded italic">
                    I
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded underline">
                    U
                  </button>
                  
                  <div className="h-4 w-px bg-gray-300"></div>
                  
                  <button 
                    onClick={addNewSection}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    + Add Section
                  </button>
                </div>
              </div>

              {/* Resume Content */}
              <div className="p-6 space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg">
                    
                    {/* Section Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className="text-lg font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-white focus:px-2 focus:py-1 focus:border focus:border-blue-500 focus:rounded"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => generateAISuggestion()}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                        >
                          AI Suggest
                        </button>
                        <button
                          onClick={() => toggleSectionEdit(section.id)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {section.isEditing ? 'Save' : 'Edit'}
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Section Content */}
                    <div className="p-4">
                      {section.isEditing ? (
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSectionContent(section.id, e.target.value)}
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder="Enter your content here..."
                        />
                      ) : (
                        <div 
                          className="whitespace-pre-wrap text-gray-700 min-h-[4rem] p-3 hover:bg-gray-50 rounded cursor-text"
                          onClick={() => toggleSectionEdit(section.id)}
                        >
                          {section.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            
            {/* AI Suggestions */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                AI Suggestions
              </h3>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Templates</h3>
              <div className="space-y-2">
                <button className="w-full p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="font-medium text-blue-800">Modern</div>
                  <div className="text-xs text-blue-600">Clean and professional</div>
                </button>
                <button className="w-full p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-800">Classic</div>
                  <div className="text-xs text-gray-600">Traditional format</div>
                </button>
                <button className="w-full p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-800">Creative</div>
                  <div className="text-xs text-gray-600">Stand out design</div>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Import from LinkedIn
                </button>
                <button className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Spell Check
                </button>
                <button className="w-full px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
                  AI Optimize
                </button>
                <button className="w-full px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
                  Export to Word
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 