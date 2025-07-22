'use client'

import { useState, useEffect, useRef } from 'react'
import "aieditor/dist/style.css"
import { OpenaiModelConfig } from 'aieditor'

interface AnalysisResult {
  matchPercentage: number
  matchingSkills: string[]
  jobSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  revisedResume: string
  resumeStats: {
    length: number
    wordCount: number
    actionVerbs: number
    quantified: boolean
  }
}

export default function ResumeEnhancer() {
  const [resumeTitle, setResumeTitle] = useState('AI Resume Enhancer')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [resumeContent, setResumeContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const aiEditorRef = useRef<any>(null)

  // Ensure we're on the client side before initializing AiEditor
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && editorRef.current && !aiEditorRef.current) {
      const initAiEditor = async () => {
        try {
          // Dynamic import only on client side
          const { AiEditor } = await import('aieditor')
          
          const aiEditor = new AiEditor({
            element: editorRef.current!,
            placeholder: "Paste your resume here...",
            content: '',
            lang: "en", // Set language to English
            ai: {
              models: {
                openai: {
                  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
                  model: "gpt-4o-mini"
                }
              }
            }
          })
          
          aiEditorRef.current = aiEditor
          setEditorError(null)
            setApiKeyError(null)
          
        } catch (error) {
          console.error('AiEditor initialization error:', error)
          setEditorError('Failed to initialize editor. Using fallback textarea.')
        }
      }

      initAiEditor()
    }

    // Cleanup function
    return () => {
      if (aiEditorRef.current && aiEditorRef.current.destroy) {
        aiEditorRef.current.destroy()
        aiEditorRef.current = null
      }
    }
  }, [isClient])

  const analyzeResume = (resume: string, jobDesc: string): AnalysisResult => {
    // Define skills categories
    const technicalSkills = {
      programming: ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'],
      databases: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'dynamodb'],
      frameworks: ['django', 'flask', 'fastapi', 'spring', 'react', 'angular', 'vue', 'node.js', 'express', 'laravel'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab'],
      tools: ['git', 'github', 'jira', 'confluence', 'slack', 'figma', 'postman', 'swagger']
    }
    
    const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'organized', 'detail-oriented', 'time management', 'collaboration']
    
    // Convert to lowercase for comparison
    const resumeLower = resume.toLowerCase()
    const jobDescLower = jobDesc.toLowerCase()
    
    // Extract skills
    const resumeSkills = new Set<string>()
    const jobSkills = new Set<string>()
    
    // Check technical skills
    Object.values(technicalSkills).flat().forEach(skill => {
      if (resumeLower.includes(skill)) resumeSkills.add(skill)
      if (jobDescLower.includes(skill)) jobSkills.add(skill)
    })
    
    // Check soft skills
    softSkills.forEach(skill => {
      if (resumeLower.includes(skill)) resumeSkills.add(skill)
      if (jobDescLower.includes(skill)) jobSkills.add(skill)
    })
    
    // Calculate matches
    const missingSkills = new Set([...jobSkills].filter(skill => !resumeSkills.has(skill)))
    const matchingSkills = new Set([...resumeSkills].filter(skill => jobSkills.has(skill)))
    const matchPercentage = jobSkills.size > 0 ? (matchingSkills.size / jobSkills.size) * 100 : 0
    
    // Check action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'built', 'optimized', 'increased', 'decreased', 'improved', 'delivered']
    const foundVerbs = actionVerbs.filter(verb => resumeLower.includes(verb))
    
    // Check for numbers/quantification
    const numbers = resume.match(/\d+/g) || []
    const quantified = numbers.length >= 2
    
    // Generate suggestions
    const suggestions: string[] = []
    
    if (missingSkills.size > 0) {
      suggestions.push("🔍 **Missing Skills to Add:**")
      missingSkills.forEach(skill => {
        suggestions.push(`   • Consider adding experience with ${skill.charAt(0).toUpperCase() + skill.slice(1)}`)
      })
      suggestions.push("")
    }
    
    if (matchPercentage < 50) {
      suggestions.push("⚠️ **Low Skill Match Detected:**")
      suggestions.push("   • Your resume shows limited alignment with the job requirements")
      suggestions.push("   • Consider highlighting transferable skills and experiences")
      suggestions.push("")
    }
    
    if (foundVerbs.length < 3) {
      suggestions.push("📝 **Resume Writing Tips:**")
      suggestions.push("   • Use more action verbs to describe your achievements")
      suggestions.push("   • Quantify your accomplishments with specific numbers")
      suggestions.push("   • Focus on results rather than just responsibilities")
      suggestions.push("")
    }
    
    if (!quantified) {
      suggestions.push("📊 **Quantify Your Achievements:**")
      suggestions.push("   • Add specific metrics (e.g., 'increased sales by 25%')")
      suggestions.push("   • Include project sizes, team sizes, or timeframes")
      suggestions.push("   • Mention any awards, certifications, or recognitions")
      suggestions.push("")
    }
    
    if (resume.length < 1000) {
      suggestions.push("📏 **Resume Length:**")
      suggestions.push("   • Your resume seems quite short")
      suggestions.push("   • Consider adding more details about your experiences")
      suggestions.push("   • Include relevant projects, certifications, or volunteer work")
      suggestions.push("")
    } else if (resume.length > 3000) {
      suggestions.push("📏 **Resume Length:**")
      suggestions.push("   • Your resume might be too long")
      suggestions.push("   • Focus on the most relevant experiences for this position")
      suggestions.push("   • Remove outdated or less relevant information")
      suggestions.push("")
    }
    
    // Generate revised resume
    const revisedResume = generateRevisedResume(resume, Array.from(jobSkills), Array.from(missingSkills), actionVerbs, foundVerbs)
    
    return {
      matchPercentage,
      matchingSkills: Array.from(matchingSkills),
      jobSkills: Array.from(jobSkills),
      missingSkills: Array.from(missingSkills),
      suggestions,
      revisedResume,
      resumeStats: {
        length: resume.length,
        wordCount: resume.split(/\s+/).length,
        actionVerbs: foundVerbs.length,
        quantified
      }
    }
  }

  const generateRevisedResume = (resume: string, jobSkills: string[], missingSkills: string[], actionVerbs: string[], foundVerbs: string[]): string => {
    const lines = resume.split('\n')
    const revisedLines: string[] = []
    
    const suggestedVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'built', 'optimized', 'increased', 'decreased', 'improved', 'delivered']
    const weakVerbs = ['did', 'worked on', 'helped with', 'was involved in', 'participated in']
    
    lines.forEach(line => {
      const originalLine = line.trim()
      if (!originalLine) {
        revisedLines.push(line)
        return
      }
      
      let revisedLine = originalLine
      
      // Highlight missing skills
      missingSkills.forEach(skill => {
        const skillVariations = [skill, skill.charAt(0).toUpperCase() + skill.slice(1), skill.toUpperCase()]
        const skillFound = skillVariations.some(variation => 
          originalLine.toLowerCase().includes(variation.toLowerCase())
        )
        
        if (!skillFound) {
          if (['experience', 'skills', 'proficient', 'knowledge'].some(word => 
            originalLine.toLowerCase().includes(word)
          )) {
            revisedLine += ` <span class="suggestion-add">[Consider adding: ${skill.charAt(0).toUpperCase() + skill.slice(1)}]</span>`
          }
        }
      })
      
      // Suggest better action verbs
      weakVerbs.forEach(weakVerb => {
        if (originalLine.toLowerCase().includes(weakVerb)) {
          const betterVerb = suggestedVerbs.find(verb => 
            !foundVerbs.includes(verb) && !originalLine.toLowerCase().includes(verb)
          )
          
          if (betterVerb) {
            const regex = new RegExp(`\\b${weakVerb}\\b`, 'gi')
            revisedLine = revisedLine.replace(regex, 
              `<span class="suggestion-verb">${weakVerb}</span> → <span class="suggestion-improvement">${betterVerb}</span>`
            )
          }
        }
      })
      
      // Suggest quantification
      if (!/\d+/.test(originalLine) && 
          ['managed', 'led', 'increased', 'improved', 'developed'].some(word => 
            originalLine.toLowerCase().includes(word)
          )) {
        if (originalLine.toLowerCase().includes('team')) {
          revisedLine += ' <span class="suggestion-quantify">[Add: "team of X people"]</span>'
        } else if (originalLine.toLowerCase().includes('project')) {
          revisedLine += ' <span class="suggestion-quantify">[Add: "X projects"]</span>'
        } else if (originalLine.toLowerCase().includes('increase') || originalLine.toLowerCase().includes('improve')) {
          revisedLine += ' <span class="suggestion-quantify">[Add: "by X%"]</span>'
        } else {
          revisedLine += ' <span class="suggestion-quantify">[Add specific metrics]</span>'
        }
      }
      
      // Highlight existing skills that match job requirements
      jobSkills.forEach(skill => {
        if (originalLine.toLowerCase().includes(skill.toLowerCase())) {
          const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
          revisedLine = revisedLine.replace(regex, `<span class="skill-match">${skill}</span>`)
        }
      })
      
      revisedLines.push(revisedLine)
    })
    
    // Add improvement summary
    const improvementSummary: string[] = []
    
    if (missingSkills.length > 0) {
      improvementSummary.push(`<strong>Add these skills:</strong> ${missingSkills.join(', ')}`)
    }
    
    if (foundVerbs.length < 5) {
      const suggestedVerbsToAdd = suggestedVerbs.filter(v => !foundVerbs.includes(v)).slice(0, 5)
      improvementSummary.push(`<strong>Use more action verbs:</strong> ${suggestedVerbsToAdd.join(', ')}`)
    }
    
    if (!/\d+/.test(resume)) {
      improvementSummary.push("<strong>Add quantification:</strong> Include specific numbers and metrics")
    }
    
    let summaryHtml = ""
    if (improvementSummary.length > 0) {
      summaryHtml = `
<div class="improvement-summary">
<h4>🎯 Key Improvements Suggested:</h4>
<ul>
${improvementSummary.map(item => `<li>${item}</li>`).join('')}
</ul>
</div>
`
    }
    
    return `
${summaryHtml}
<div class="resume-content">
${revisedLines.join('\n')}
</div>
`
  }

  const handleAnalyzeResume = async () => {
    setIsAnalyzing(true)
    
    try {
      // Get content from AiEditor or fallback textarea
      let currentResumeContent = ''
      
      if (aiEditorRef.current && !editorError) {
        // Use the correct AiEditor methods
        try {
          // Try getMarkdown first (preferred method according to docs)
          currentResumeContent = aiEditorRef.current.getMarkdown()
          console.log('Retrieved content from AiEditor (markdown):', currentResumeContent)
        } catch (markdownError) {
          try {
            // Fallback to getHtml if available
            currentResumeContent = aiEditorRef.current.getHtml()
            console.log('Retrieved content from AiEditor (html):', currentResumeContent)
          } catch (htmlError) {
            // Final fallback: try to get content from the editor element
            const editorElement = editorRef.current?.querySelector('[contenteditable="true"]')
            if (editorElement) {
              currentResumeContent = editorElement.textContent || ''
              console.log('Retrieved content from editor element:', currentResumeContent)
            }
          }
        }
      } else {
        // Use fallback textarea content from state
        currentResumeContent = resumeContent
        console.log('Using fallback textarea content:', currentResumeContent)
      }
      
      if (!currentResumeContent.trim() || !jobDescription.trim()) {
        alert('Please provide both resume content and job description')
        setIsAnalyzing(false)
        return
      }
      
      // Perform analysis
      const result = analyzeResume(currentResumeContent, jobDescription)
      setAnalysisResult(result)
      setShowResults(true)
      
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Error analyzing resume. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
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

          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!showResults ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* API Key Warning */}
            {apiKeyError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">API Key Required</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{apiKeyError}</p>
                      <p className="mt-1">Create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in the frontend directory with:</p>
                      <pre className="mt-1 bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
NEXT_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AiEditor container */}
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Resume</h3>
            {editorError ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  <p>{editorError}</p>
                  <p>Using fallback textarea for editing.</p>
                </div>
                <textarea
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="Paste your resume here..."
                  rows={16}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ) : (
              <div 
                ref={editorRef} 
                style={{ height: '400px', marginBottom: '20px' }}
              />
            )}
            
            {/* Job Description Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Job Description</h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center">
              <button
                onClick={handleAnalyzeResume}
                disabled={isAnalyzing}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Optimizing...' : 'Optimize Resume based on JD'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
              <button
                onClick={() => setShowResults(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to Editor
              </button>
            </div>

            {analysisResult && (
              <div className="space-y-6">
                {/* Match Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Match Summary</h3>
                  <p className="text-2xl font-bold text-blue-600">{analysisResult.matchPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-blue-700">Skill Match Percentage</p>
                </div>

                {/* Skills Analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Skills You Have</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.matchingSkills.length > 0 ? (
                        analysisResult.matchingSkills.map(skill => (
                          <span key={skill} className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-green-700">None found</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">🎯 Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingSkills.length > 0 ? (
                        analysisResult.missingSkills.map(skill => (
                          <span key={skill} className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-red-700">Great! No missing skills</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">📈 Resume Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Length</p>
                      <p className="text-gray-600">{analysisResult.resumeStats.length} characters</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Word Count</p>
                      <p className="text-gray-600">{analysisResult.resumeStats.wordCount} words</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Action Verbs</p>
                      <p className="text-gray-600">{analysisResult.resumeStats.actionVerbs}/12</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Quantified</p>
                      <p className="text-gray-600">{analysisResult.resumeStats.quantified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {analysisResult.suggestions.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Suggestions for Improvement</h3>
                    <div className="space-y-2">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-yellow-700 text-sm">{suggestion}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revised Resume */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Revised Resume with Suggestions</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: analysisResult.revisedResume }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS for highlighting */}
      <style jsx>{`
        .suggestion-add {
          background-color: #fef3c7;
          color: #92400e;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        .suggestion-verb {
          background-color: #fee2e2;
          color: #991b1b;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        .suggestion-improvement {
          background-color: #dcfce7;
          color: #166534;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        .suggestion-quantify {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        .skill-match {
          background-color: #dcfce7;
          color: #166534;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
        .improvement-summary {
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .resume-content {
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
} 