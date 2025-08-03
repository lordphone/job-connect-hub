'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

interface JobPost {
  job_post_id: string
  job_title: string
  job_description: string
  job_salary: number
  job_type: string
  created_at: string
  user_id: string
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiEditorRef = useRef<any>(null)
  
  // Modal state for job tailor function
  const [showJobTailorModal, setShowJobTailorModal] = useState(false)
  const [jobTailorDescription, setJobTailorDescription] = useState('')
  const [selectedTextForTailor, setSelectedTextForTailor] = useState('')
  const [isTailoring, setIsTailoring] = useState(false)

  // Job description tabs state
  const [activeTab, setActiveTab] = useState<'paste' | 'browse'>('paste')
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [loadingJobPosts, setLoadingJobPosts] = useState(false)
  const [selectedJobPost, setSelectedJobPost] = useState<JobPost | null>(null)

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
                 {
                   icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13L13.5 7.5C13.1 6.8 12.4 6.3 11.7 6.3C11 6.3 10.3 6.8 9.9 7.5L6 18H8L11.2 10L12 13H14L20 7V9H21Z"></path></svg>`,
                   name: "Tailor to Job",
                   text: "selected",
                   model: "auto",
                   onClick: handleJobTailorClick
                 },
                {
                  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 19C12.8284 19 13.5 19.6716 13.5 20.5C13.5 21.3284 12.8284 22 12 22C11.1716 22 10.5 21.3284 10.5 20.5C10.5 19.6716 11.1716 19 12 19ZM6.5 19C7.32843 19 8 19.6716 8 20.5C8 21.3284 7.32843 22 6.5 22C5.67157 22 5 21.3284 5 20.5C5 19.6716 5.67157 19 6.5 19ZM17.5 19C18.3284 19 19 19.6716 19 20.5C19 21.3284 18.3284 22 17.5 22C16.6716 22 16 21.3284 16 20.5C16 19.6716 16.6716 19 17.5 19ZM13 2V4H19V6L17.0322 6.0006C16.2423 8.3666 14.9984 10.5065 13.4107 12.302C14.9544 13.6737 16.7616 14.7204 18.7379 15.3443L18.2017 17.2736C15.8917 16.5557 13.787 15.3326 12.0005 13.7257C10.214 15.332 8.10914 16.5553 5.79891 17.2734L5.26257 15.3442C7.2385 14.7203 9.04543 13.6737 10.5904 12.3021C9.46307 11.0285 8.50916 9.58052 7.76789 8.00128L10.0074 8.00137C10.5706 9.03952 11.2401 10.0037 11.9998 10.8772C13.2283 9.46508 14.2205 7.81616 14.9095 6.00101L5 6V4H11V2H13Z"></path></svg>`,
                  name: "Emoji - Test",
                  prompt: "Rewrite this part of the resume with emojis only. No text allowed",
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

  // Handle custom job tailor function
  const handleJobTailorClick = () => {
    if (!aiEditorRef.current) {
      alert('Editor not ready')
      return
    }

    try {
      // Try different methods to get selected text
      let selectedText = ''
      
      // Method 1: Try getSelectedText
      if (typeof aiEditorRef.current.getSelectedText === 'function') {
        selectedText = aiEditorRef.current.getSelectedText()
      }
      
      // Method 2: Try getSelection
      if (!selectedText && typeof aiEditorRef.current.getSelection === 'function') {
        const selection = aiEditorRef.current.getSelection()
        selectedText = selection?.toString() || ''
      }
      
      // Method 3: Try using window selection as fallback
      if (!selectedText) {
        const windowSelection = window.getSelection()
        selectedText = windowSelection?.toString() || ''
      }
      
      if (!selectedText.trim()) {
        alert('Please select some text in your resume to tailor')
        return
      }

      setSelectedTextForTailor(selectedText)
      setShowJobTailorModal(true)
    } catch (error) {
      console.error('Error getting selected text:', error)
      alert('Could not get selected text. Please try again.')
    }
  }

  const handleJobTailorSubmit = async () => {
    if (!jobTailorDescription.trim()) {
      alert('Please enter a job description')
      return
    }

    if (!selectedTextForTailor.trim()) {
      alert('No text selected')
      return
    }

    setIsTailoring(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const tailorPrompt = `
You are an expert resume writer. Please rewrite the following resume section to better align with the specific job description provided.

RESUME SECTION TO REWRITE:
"{content}"

JOB DESCRIPTION:
${jobTailorDescription}

Instructions:
1. Maintain all factual information from the original resume section
2. Use keywords and terminology from the job description where appropriate
3. Emphasize skills and experiences that are most relevant to this specific job
4. Use stronger action verbs and more impactful language
5. Ensure the content flows naturally and reads professionally
6. Keep the same general structure but optimize the language for this job

Return only the improved resume section, highlighting the changes and with no additional explanations or formatting.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume writer. Return only the improved resume content, no additional text or formatting.'
            },
            {
              role: 'user',
              content: tailorPrompt.replace('{content}', selectedTextForTailor)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const tailoredContent = data.choices[0]?.message?.content

      if (!tailoredContent) {
        throw new Error('No content received from AI')
      }

      // Try multiple methods to replace the text
      let textReplaced = false
      
      // Try multiple methods to replace the text
      if (aiEditorRef.current) {
        // Method 1: Try replaceSelectedText
        if (typeof aiEditorRef.current.replaceSelectedText === 'function') {
          try {
            aiEditorRef.current.replaceSelectedText(tailoredContent)
            textReplaced = true
          } catch {
            // Continue to next method
          }
        }
        
        // Method 2: Try insertText
        if (!textReplaced && typeof aiEditorRef.current.insertText === 'function') {
          try {
            aiEditorRef.current.insertText(tailoredContent)
            textReplaced = true
          } catch {
            // Continue to next method
          }
        }
        
        // Method 3: Try using the editor's insert method
        if (!textReplaced && typeof aiEditorRef.current.insert === 'function') {
          try {
            aiEditorRef.current.insert(tailoredContent)
            textReplaced = true
          } catch {
            // Continue to next method
          }
        }
        
        // Method 4: Try executing a command
        if (!textReplaced && typeof aiEditorRef.current.chain === 'function') {
          try {
            aiEditorRef.current.chain()?.focus()?.insertContent(tailoredContent)?.run()
            textReplaced = true
          } catch {
            // Continue to next method
          }
        }
        
        // Method 5: Try setContent as last resort (replaces all content)
        if (!textReplaced && typeof aiEditorRef.current.setContent === 'function') {
          try {
            const currentContent = aiEditorRef.current.getMarkdown?.() || aiEditorRef.current.getHtml?.() || ''
            const newContent = currentContent.replace(selectedTextForTailor, tailoredContent)
            aiEditorRef.current.setContent(newContent)
            textReplaced = true
          } catch {
            // Continue to fallback
          }
        }
      }
      
      if (!textReplaced) {
        // Show the result in an alert as fallback
        alert(`Tailored content (please copy and paste manually):\n\n${tailoredContent}`)
      }

      // Close modal and reset state
      setShowJobTailorModal(false)
      setJobTailorDescription('')
      setSelectedTextForTailor('')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error tailoring resume: ${errorMessage}`)
    } finally {
      setIsTailoring(false)
    }
  }

  const analyzeResume = async (resume: string, jobDesc: string): Promise<AnalysisResult> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const analysisPrompt = `
You are an expert resume analyzer and career coach. Analyze the provided resume against the job description and return a structured JSON response.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

Please analyze and return a JSON object with the following structure:
{
  "matchPercentage": number (0-100, how well the resume matches the job requirements),
  "matchingSkills": string[] (skills/technologies the candidate has that match job requirements),
  "jobSkills": string[] (all skills/technologies mentioned in the job description),
  "missingSkills": string[] (important skills from job description not found in resume),
  "suggestions": string[] (specific actionable improvement suggestions with emojis),
  "resumeStats": {
    "actionVerbs": number (count of strong action verbs found),
    "quantified": boolean (whether resume includes metrics/numbers)
  }
}

Focus on:
- Technical skills, soft skills, experience level, certifications
- Quality of language (action verbs, quantified achievements)
- Alignment with job requirements and industry standards
- Specific, actionable suggestions for improvement

Be thorough but concise. Include emojis in suggestions for better readability.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume analyzer. Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or additional text. Return pure JSON that can be parsed directly.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const analysisContent = data.choices[0]?.message?.content

      if (!analysisContent) {
        throw new Error('No analysis content received from OpenAI')
      }

      // Clean the response content to extract valid JSON
      let cleanedContent = analysisContent.trim()
      
      // Remove any markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      let analysisData
      try {
        analysisData = JSON.parse(cleanedContent)
        console.log('Successfully parsed AI response:', analysisData)
      } catch (parseError) {
        console.error('Failed to parse AI response. Original content:', analysisContent)
        console.error('Cleaned content:', cleanedContent)
        console.error('Parse error:', parseError)
        
        // Try to provide a more helpful error message
        if (cleanedContent.includes('```')) {
          throw new Error('AI response contains markdown formatting. Please try again.')
        } else if (cleanedContent.length < 10) {
          throw new Error('AI response is too short. Please try again.')
        } else {
          throw new Error(`Invalid JSON format from AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
        }
      }

      // Generate revised resume using AI
      const revisedResume = await generateAIRevisedResume(resume, jobDesc, analysisData)

      return {
        matchPercentage: analysisData.matchPercentage || 0,
        matchingSkills: analysisData.matchingSkills || [],
        jobSkills: analysisData.jobSkills || [],
        missingSkills: analysisData.missingSkills || [],
        suggestions: analysisData.suggestions || [],
        revisedResume,
        resumeStats: {
          length: resume.length,
          wordCount: resume.split(/\s+/).length,
          actionVerbs: analysisData.resumeStats?.actionVerbs || 0,
          quantified: analysisData.resumeStats?.quantified || false
        }
      }

    } catch (error) {
      console.error('Error in AI analysis:', error)
      
      // Provide more specific error messages
      let errorMessage = '❌ AI analysis failed. Please check your OpenAI API key configuration.'
      
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = '❌ AI response format error. Please try again with different content.'
        } else if (error.message.includes('API')) {
          errorMessage = '❌ API connection error. Please check your internet connection and API key.'
        } else {
          errorMessage = `❌ Analysis error: ${error.message}`
        }
      }
      
      // Fallback to basic analysis if AI fails
      return {
        matchPercentage: 0,
        matchingSkills: [],
        jobSkills: [],
        missingSkills: [],
        suggestions: [errorMessage],
        revisedResume: resume,
        resumeStats: {
          length: resume.length,
          wordCount: resume.split(/\s+/).length,
          actionVerbs: 0,
          quantified: false
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateAIRevisedResume = async (resume: string, jobDesc: string, analysisData: any): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        return resume // Fallback to original resume
      }

      const revisionPrompt = `
You are an expert resume writer. Please rewrite the following resume to better align with the job description, incorporating the analysis insights.

ORIGINAL RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

ANALYSIS INSIGHTS:
- Missing Skills: ${analysisData.missingSkills?.join(', ') || 'None identified'}
- Match Percentage: ${analysisData.matchPercentage || 0}%
- Suggestions: ${analysisData.suggestions?.join('; ') || 'None'}

Please return an improved resume that:
1. Maintains all factual information from the original
2. Uses stronger action verbs and more impactful language
3. Better highlights relevant skills and experiences for this specific job
4. Includes suggestions for adding missing skills where appropriate
5. Improves formatting and readability
6. Adds placeholders for quantified achievements where they're missing

Format the response as HTML with these CSS classes for highlighting:
- Use <span class="skill-match">SKILL</span> for skills that match job requirements
- Use <span class="suggestion-add">[Suggestion: ADD_THIS]</span> for areas needing improvement
- Use <span class="suggestion-quantify">[Add metrics: X% increase, $Y saved, etc.]</span> for quantification opportunities
- Use <span class="suggestion-improvement">IMPROVED_TEXT</span> for enhanced language

Return only the formatted resume content, no additional explanations.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume writer. Return only the improved resume content in HTML format with the specified CSS classes.'
            },
            {
              role: 'user',
              content: revisionPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      })

      if (!response.ok) {
        console.error('OpenAI API error for resume revision:', response.status)
        return resume // Fallback to original resume
      }

      const data = await response.json()
      const revisedContent = data.choices[0]?.message?.content

      if (!revisedContent) {
        console.error('No revised content received from OpenAI')
        return resume // Fallback to original resume
      }

      // Add improvement summary at the top
      const improvementSummary = `
<div class="improvement-summary">
<h4>🎯 AI-Enhanced Resume Analysis:</h4>
<ul>
<li><strong>Match Score:</strong> ${analysisData.matchPercentage || 0}% alignment with job requirements</li>
${analysisData.missingSkills?.length > 0 ? `<li><strong>Missing Skills to Highlight:</strong> ${analysisData.missingSkills.join(', ')}</li>` : ''}
<li><strong>Key Improvements:</strong> Enhanced language, better skill highlighting, and formatting optimization</li>
</ul>
</div>
`

      return `${improvementSummary}<div class="resume-content">${revisedContent}</div>`

    } catch (error) {
      console.error('Error generating AI revised resume:', error)
      return resume // Fallback to original resume
    }
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
        } catch {
          try {
            // Fallback to getHtml if available
            currentResumeContent = aiEditorRef.current.getHtml()
            console.log('Retrieved content from AiEditor (html):', currentResumeContent)
          } catch {
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
      const result = await analyzeResume(currentResumeContent, jobDescription)
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
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => {
                    setActiveTab('paste')
                    setSelectedJobPost(null)
                  }}
                  className={`py-2 px-4 font-medium text-gray-700 ${activeTab === 'paste' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
                >
                  📝 Paste
                </button>
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`py-2 px-4 font-medium text-gray-700 ${activeTab === 'browse' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
                >
                  🔍 Browse
                </button>
              </div>

              {activeTab === 'paste' && (
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}

               {activeTab === 'browse' && (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <button
                       onClick={async () => {
                         setLoadingJobPosts(true)
                         const { data, error } = await supabase.from('job_posts').select('*').order('created_at', { ascending: false })
                         if (error) {
                           console.error('Error fetching job posts:', error)
                           alert('Failed to load job posts.')
                         } else {
                           setJobPosts(data as JobPost[])
                         }
                         setLoadingJobPosts(false)
                       }}
                       disabled={loadingJobPosts}
                       className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                     >
                       {loadingJobPosts ? 'Loading...' : '📋 Load Recent Job Posts'}
                     </button>
                     {selectedJobPost && (
                       <div className="text-right">
                         <span className="text-sm text-green-600 font-medium block">
                           ✅ {selectedJobPost.job_title} selected
                         </span>
                         <button
                           onClick={() => {
                             setSelectedJobPost(null)
                             setJobDescription('')
                           }}
                           className="text-xs text-red-500 hover:text-red-700 mt-1"
                         >
                           Clear selection
                         </button>
                       </div>
                     )}
                   </div>
                   
                   {loadingJobPosts ? (
                     <div className="text-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                       <p className="text-gray-600">Loading job posts...</p>
                     </div>
                   ) : jobPosts.length > 0 ? (
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                       {jobPosts.map(post => (
                         <div
                           key={post.job_post_id}
                           className={`p-4 rounded-lg cursor-pointer border transition-all ${
                             selectedJobPost?.job_post_id === post.job_post_id
                               ? 'bg-blue-50 border-blue-300 shadow-md'
                               : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                           }`}
                           onClick={() => {
                             setSelectedJobPost(post)
                             setJobDescription(post.job_description)
                           }}
                         >
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="text-lg font-semibold text-gray-800">{post.job_title}</h4>
                             {selectedJobPost?.job_post_id === post.job_post_id && (
                               <span className="text-blue-600 text-sm font-medium">✓ Selected</span>
                             )}
                           </div>
                           <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                             {post.job_description.length > 150 
                               ? `${post.job_description.substring(0, 150)}...` 
                               : post.job_description
                             }
                           </p>
                           <div className="flex justify-between items-center text-xs text-gray-500">
                             <span>💼 {post.job_type}</span>
                             <span>💰 ${post.job_salary.toLocaleString()}</span>
                             <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8 text-gray-500">
                       <p className="mb-2">No job posts found</p>
                       <p className="text-sm">Click "Load Recent Job Posts" to browse available positions</p>
                     </div>
                   )}
                 </div>
               )}
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

      {/* Job Tailor Modal */}
      {showJobTailorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tailor Resume Section to Job</h2>
              <button
                onClick={() => {
                  setShowJobTailorModal(false)
                  setJobTailorDescription('')
                  setSelectedTextForTailor('')
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                disabled={isTailoring}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Resume Section:</h3>
                <div className="bg-gray-50 p-3 rounded border text-sm max-h-32 overflow-y-auto">
                  {selectedTextForTailor}
                </div>
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description:
                </label>
                <textarea
                  id="jobDescription"
                  value={jobTailorDescription}
                  onChange={(e) => setJobTailorDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isTailoring}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowJobTailorModal(false)
                  setJobTailorDescription('')
                  setSelectedTextForTailor('')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isTailoring}
              >
                Cancel
              </button>
              <button
                onClick={handleJobTailorSubmit}
                disabled={isTailoring || !jobTailorDescription.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTailoring ? 'Tailoring...' : 'Tailor Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

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