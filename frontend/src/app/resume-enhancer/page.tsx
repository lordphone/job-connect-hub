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
              },
              // Toolbar AI menus (appear when clicking AI button in toolbar)
              menus: [
                {
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
                  name: "Continue Resume Section",
                  prompt: "Please help me expand and continue writing this resume section with relevant professional experience and skills.",
                  text: "focusBefore",
                  model: "auto",
                },
                {
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15.2238 15.5079L13.0111 20.1581C12.8687 20.4573 12.5107 20.5844 12.2115 20.442C12.1448 20.4103 12.0845 20.3665 12.0337 20.3129L8.49229 16.5741C8.39749 16.474 8.27113 16.4096 8.13445 16.3918L3.02816 15.7243C2.69958 15.6814 2.46804 15.3802 2.51099 15.0516C2.52056 14.9784 2.54359 14.9075 2.5789 14.8426L5.04031 10.3192C5.1062 10.1981 5.12839 10.058 5.10314 9.92253L4.16 4.85991C4.09931 4.53414 4.3142 4.22086 4.63997 4.16017C4.7126 4.14664 4.78711 4.14664 4.85974 4.16017L9.92237 5.10331C10.0579 5.12855 10.198 5.10637 10.319 5.04048L14.8424 2.57907C15.1335 2.42068 15.4979 2.52825 15.6562 2.81931C15.6916 2.88421 15.7146 2.95507 15.7241 3.02833L16.3916 8.13462C16.4095 8.2713 16.4739 8.39766 16.5739 8.49245L20.3127 12.0338C20.5533 12.2617 20.5636 12.6415 20.3357 12.8821C20.2849 12.9357 20.2246 12.9795 20.1579 13.0112L15.5078 15.224C15.3833 15.2832 15.283 15.3835 15.2238 15.5079ZM16.0206 17.435L17.4348 16.0208L21.6775 20.2634L20.2633 21.6776L16.0206 17.435Z"></path></svg>`,
                  name: "Enhance Resume Language",
                  prompt: "Please improve the professional language and impact of this resume content, making it more compelling to employers.",
                  text: "selected",
                  model: "auto",
                },
                {
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.1213L9.06066 15.0607L7.64645 13.6464L13 8.29289L16 11.2929L19.9393 5.93934Z"></path></svg>`,
                  name: "Add Metrics & Achievements",
                  prompt: "Please help me add specific metrics, numbers, and quantifiable achievements to make this resume content more impactful.",
                  text: "selected",
                  model: "auto",
                },
              ],
              // Bubble menu (appears when text is selected)
              bubblePanelMenus: [
                {
                  prompt: `<content>{content}</content>\nPlease optimize this resume content for ATS (Applicant Tracking Systems) and improve its professional impact. Make it more compelling while keeping it truthful.`,
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.1986 9.94447C14.7649 9.5337 14.4859 8.98613 14.4085 8.39384L14.0056 5.31138L11.275 6.79724C10.7503 7.08274 10.1433 7.17888 9.55608 7.06948L6.49998 6.50015L7.06931 9.55625C7.17871 10.1435 7.08257 10.7505 6.79707 11.2751L5.31121 14.0057L8.39367 14.4086C8.98596 14.4861 9.53353 14.7651 9.94431 15.1987L12.0821 17.4557L13.4178 14.6486C13.6745 14.1092 14.109 13.6747 14.6484 13.418L17.4555 12.0823L15.1986 9.94447ZM15.2238 15.5079L13.0111 20.1581C12.8687 20.4573 12.5107 20.5844 12.2115 20.442C12.1448 20.4103 12.0845 20.3665 12.0337 20.3129L8.49229 16.5741C8.39749 16.474 8.27113 16.4096 8.13445 16.3918L3.02816 15.7243C2.69958 15.6814 2.46804 15.3802 2.51099 15.0516C2.52056 14.9784 2.54359 14.9075 2.5789 14.8426L5.04031 10.3192C5.1062 10.1981 5.12839 10.058 5.10314 9.92253L4.16 4.85991C4.09931 4.53414 4.3142 4.22086 4.63997 4.16017C4.7126 4.14664 4.78711 4.14664 4.85974 4.16017L9.92237 5.10331C10.0579 5.12855 10.198 5.10637 10.319 5.04048L14.8424 2.57907C15.1335 2.42068 15.4979 2.52825 15.6562 2.81931C15.6916 2.88421 15.7146 2.95507 15.7241 3.02833L16.3916 8.13462C16.4095 8.2713 16.4739 8.39766 16.5739 8.49245L20.3127 12.0338C20.5533 12.2617 20.5636 12.6415 20.3357 12.8821C20.2849 12.9357 20.2246 12.9795 20.1579 13.0112L15.5078 15.224C15.3833 15.2832 15.283 15.3835 15.2238 15.5079ZM16.0206 17.435L17.4348 16.0208L21.6775 20.2634L20.2633 21.6776L16.0206 17.435Z"></path></svg>`,
                  title: 'optimize-for-ats',
                },
                {
                  prompt: `<content>{content}</content>\nPlease rewrite this resume section using stronger action verbs and more impactful language to better showcase achievements.`,
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19C12.8284 19 13.5 19.6716 13.5 20.5C13.5 21.3284 12.8284 22 12 22C11.1716 22 10.5 21.3284 10.5 20.5C10.5 19.6716 11.1716 19 12 19ZM6.5 19C7.32843 19 8 19.6716 8 20.5C8 21.3284 7.32843 22 6.5 22C5.67157 22 5 21.3284 5 20.5C5 19.6716 5.67157 19 6.5 19ZM17.5 19C18.3284 19 19 19.6716 19 20.5C19 21.3284 18.3284 22 17.5 22C16.6716 22 16 21.3284 16 20.5C16 19.6716 16.6716 19 17.5 19ZM13 2V4H19V6L17.0322 6.0006C16.2423 8.3666 14.9984 10.5065 13.4107 12.302C14.9544 13.6737 16.7616 14.7204 18.7379 15.3443L18.2017 17.2736C15.8917 16.5557 13.787 15.3326 12.0005 13.7257C10.214 15.332 8.10914 16.5553 5.79891 17.2734L5.26257 15.3442C7.2385 14.7203 9.04543 13.6737 10.5904 12.3021C9.46307 11.0285 8.50916 9.58052 7.76789 8.00128L10.0074 8.00137C10.5706 9.03952 11.2401 10.0037 11.9998 10.8772C13.2283 9.46508 14.2205 7.81616 14.9095 6.00101L5 6V4H11V2H13Z"></path></svg>`,
                  title: 'strengthen-language',
                },
                '<hr/>',
                {
                  prompt: `<content>{content}</content>\nPlease help me add specific metrics, percentages, dollar amounts, or other quantifiable results to this resume content to make it more impactful.`,
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.1213L9.06066 15.0607L7.64645 13.6464L13 8.29289L16 11.2929L19.9393 5.93934Z"></path></svg>`,
                  title: 'add-metrics',
                },
                {
                  prompt: `<content>{content}</content>\nPlease reformat this resume content to follow best practices for structure, formatting, and readability while maintaining all the information.`,
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3C19.6569 3 21 4.34315 21 6C21 7.65685 19.6569 9 18 9H15C13.6941 9 12.5831 8.16562 12.171 7.0009L11 7C9.9 7 9 7.9 9 9L9.0009 9.17102C10.1656 9.58312 11 10.6941 11 12C11 13.3059 10.1656 14.4169 9.0009 14.829L9 15C9 16.1 9.9 17 11 17L12.1707 17.0001C12.5825 15.8349 13.6937 15 15 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21H15C13.6941 21 12.5831 20.1656 12.171 19.0009L11 19C8.79 19 7 17.21 7 15H5C3.34315 15 2 13.6569 2 12C2 10.3431 3.34315 9 5 9H7C7 6.79086 8.79086 5 11 5L12.1707 5.00009C12.5825 3.83485 13.6937 3 15 3H18ZM18 17H15C14.4477 17 14 17.4477 14 18C14 18.5523 14.4477 19 15 19H18C18.5523 19 19 18.5523 19 18C19 17.4477 18.5523 17 18 17ZM8 11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H8C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11ZM18 5H15C14.4477 5 14 5.44772 14 6C14 6.55228 14.4477 7 15 7H18C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"></path></svg>`,
                  title: 'improve-formatting',
                },
              ]
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