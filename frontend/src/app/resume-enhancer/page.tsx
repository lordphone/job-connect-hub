'use client'

import { useState, useEffect, useRef } from 'react'

// Import AiEditor types and styles with error handling
interface AiEditorInstance {
  getContent?: () => string
  getHtml?: () => string
  getText?: () => string
  getMarkdown?: () => string
  getContentHtml?: () => string
  getContentText?: () => string
  destroy?: () => void
}

// Use dynamic import for AiEditor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AiEditor: any = null

import 'aieditor/dist/style.css'
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
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const aiEditorRef = useRef<AiEditorInstance | null>(null)

  useEffect(() => {
    const initAiEditor = async () => {
      if (editorRef.current && !aiEditorRef.current) {
        try {
          // Check if API key is available
          const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
          if (!apiKey) {
            setApiKeyError('OpenAI API key not found. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file.')
            setEditorError('AI features disabled due to missing API key. Using fallback textarea.')
            return
          }
          
          // Dynamic import of AiEditor
          const aieditorModule = await import('aieditor')
          AiEditor = aieditorModule.AiEditor
          
          if (AiEditor) {
            // Initialize AiEditor
            aiEditorRef.current = new AiEditor({
              element: editorRef.current,
              placeholder: "Paste your resume here...",
              content: '',
              lang: 'en',
              ai: {
                models: {
                  openai: {
                    apiKey: apiKey,
                    model: 'gpt-4o-mini'
                  } as OpenaiModelConfig,
                },
                menus: [
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
                      name: "ai-continuation",
                      prompt: "{content}\n\nPlease help me continue and expand this text. Return only the expanded content without any explanations.",
                      text: "focusBefore",
                      model: "auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                      name: "ai-optimization",
                      prompt: "{content}\n\nPlease help me optimize this text and return the improved version. Return only the optimized content without any explanations.",
                      text: "selected",
                      model: "auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M17.934 3.0359L19.666 4.0359L18.531 6H21V8H19V12H21V14H19V21H17V14L13.9157 14.0004C13.5914 16.8623 12.3522 19.3936 10.5466 21.1933L8.98361 19.9233C10.5031 18.4847 11.5801 16.4008 11.9008 14.0009L10 14V12L12 11.999V8H10V6H12.467L11.334 4.0359L13.066 3.0359L14.777 6H16.221L17.934 3.0359ZM5 13.803L3 14.339V12.268L5 11.732V8H3V6H5V3H7V6H9V8H7V11.197L9 10.661V12.731L7 13.267V18.5C7 19.8807 5.88071 21 4.5 21H3V19H4.5C4.74546 19 4.94961 18.8231 4.99194 18.5899L5 18.5V13.803ZM17 8H14V12H17V8Z"></path></svg>`,
                      name: "ai-proofreading",
                      prompt: "{content}\n\nPlease help me find and correct any spelling or grammatical errors in this text. Return only the corrected text without any explanations.",
                      text: "selected",
                      model: "auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>`,
                      name: "ai-translation",
                      prompt: "Please help me translate this content. If it's in English, translate it to Chinese. If it's in another language, translate it to English. Return only the translation without any explanations.",
                      text: "selected",
                      model: "auto",
                  }
                ]
              }
            })
            setEditorError(null)
            setApiKeyError(null)
          }
        } catch (error) {
          console.error('AiEditor initialization error:', error)
          setEditorError('Failed to initialize editor. Using fallback textarea.')
        }
      }
    }

    initAiEditor()

    // Cleanup function
    return () => {
      if (aiEditorRef.current) {
        try {
          aiEditorRef.current.destroy?.()
        } catch (error) {
          console.error('AiEditor cleanup error:', error)
        }
        aiEditorRef.current = null
      }
    }
  }, [])

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
      let resumeContent = ''
      
      if (aiEditorRef.current && !editorError) {
        // Debug: log available methods
        console.log('AiEditor instance methods:', Object.getOwnPropertyNames(aiEditorRef.current))
        console.log('AiEditor instance:', aiEditorRef.current)
        
        // Try different methods to get content
        if (aiEditorRef.current.getContent) {
          resumeContent = aiEditorRef.current.getContent()
        } else if (aiEditorRef.current.getHtml) {
          resumeContent = aiEditorRef.current.getHtml()
        } else if (aiEditorRef.current.getText) {
          resumeContent = aiEditorRef.current.getText()
        } else if (aiEditorRef.current.getMarkdown) {
          resumeContent = aiEditorRef.current.getMarkdown()
        } else if (aiEditorRef.current.getContentHtml) {
          resumeContent = aiEditorRef.current.getContentHtml()
        } else if (aiEditorRef.current.getContentText) {
          resumeContent = aiEditorRef.current.getContentText()
        } else {
          // Fallback: try to get content from the editor element
          const editorElement = editorRef.current?.querySelector('[contenteditable="true"]')
          if (editorElement) {
            resumeContent = editorElement.textContent || ''
          }
        }
        
        console.log('Retrieved content from AiEditor:', resumeContent)
      } else {
        // Use fallback textarea content from state
        resumeContent = resumeContent
        console.log('Using fallback textarea content:', resumeContent)
      }
      
      if (!resumeContent.trim() || !jobDescription.trim()) {
        alert('Please provide both resume content and job description')
        setIsAnalyzing(false)
        return
      }
      
      // Perform analysis
      const result = analyzeResume(resumeContent, jobDescription)
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
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
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