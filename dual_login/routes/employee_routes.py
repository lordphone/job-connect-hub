# routes/employee_routes.py
from fastapi import APIRouter, Request, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from ..database import supabase, SUPABASE_BUCKET, SUPABASE_URL
from ..auth import get_current_user
from ..models import EmployeeCreate, EmployeeUpdate
from ..forms import as_form
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="./dual_login/templates")

@router.get("/", response_class=HTMLResponse)
async def user_dashboard(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

@router.get("/user_homepage", response_class=HTMLResponse)
async def user_dashboard(request: Request, current_user: dict = Depends(get_current_user)):
    return templates.TemplateResponse("user_dashboard.html", {"request": request})

@router.get("/employer_homepage", response_class=HTMLResponse)
async def employer_home(request: Request):
    return templates.TemplateResponse("employer_homepage.html", {"request": request})

def generate_revised_resume(resume, job_skills, missing_skills, action_verbs, found_verbs):
    """
    Generate a revised version of the resume with suggested improvements highlighted
    """
    import re
    
    # Split resume into lines for processing
    lines = resume.split('\n')
    revised_lines = []
    
    # Common action verbs to suggest
    suggested_verbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 
                      'built', 'optimized', 'increased', 'decreased', 'improved', 'delivered',
                      'coordinated', 'facilitated', 'established', 'launched', 'streamlined']
    
    # Quantification patterns to suggest
    quantification_suggestions = [
        'increased by X%', 'reduced by X%', 'improved by X%', 'managed team of X people',
        'delivered X projects', 'processed X transactions', 'handled X customers',
        'saved $X', 'generated $X in revenue', 'completed in X months'
    ]
    
    for line in lines:
        original_line = line.strip()
        if not original_line:
            revised_lines.append(line)
            continue
            
        revised_line = original_line
        
        # Highlight missing skills in the line
        for skill in missing_skills:
            # Check if the skill is mentioned in a different form
            skill_variations = [skill, skill.title(), skill.upper()]
            skill_found = False
            for variation in skill_variations:
                if variation.lower() in original_line.lower():
                    skill_found = True
                    break
            
            if not skill_found:
                # Add suggestion for missing skill
                if any(word in original_line.lower() for word in ['experience', 'skills', 'proficient', 'knowledge']):
                    revised_line += f' <span class="suggestion-add">[Consider adding: {skill.title()}]</span>'
        
        # Suggest better action verbs
        weak_verbs = ['did', 'worked on', 'helped with', 'was involved in', 'participated in']
        for weak_verb in weak_verbs:
            if weak_verb in original_line.lower():
                # Find a better action verb from the job skills context
                better_verb = None
                for verb in suggested_verbs:
                    if verb not in found_verbs and verb not in original_line.lower():
                        better_verb = verb
                        break
                
                if better_verb:
                    revised_line = re.sub(
                        rf'\b{weak_verb}\b', 
                        f'<span class="suggestion-verb">{weak_verb}</span> → <span class="suggestion-improvement">{better_verb}</span>', 
                        original_line, 
                        flags=re.IGNORECASE
                    )
        
        # Suggest quantification
        if not re.search(r'\d+', original_line) and any(word in original_line.lower() for word in ['managed', 'led', 'increased', 'improved', 'developed']):
            # Find appropriate quantification suggestion
            if 'team' in original_line.lower():
                revised_line += ' <span class="suggestion-quantify">[Add: "team of X people"]</span>'
            elif 'project' in original_line.lower():
                revised_line += ' <span class="suggestion-quantify">[Add: "X projects"]</span>'
            elif 'increase' in original_line.lower() or 'improve' in original_line.lower():
                revised_line += ' <span class="suggestion-quantify">[Add: "by X%"]</span>'
            else:
                revised_line += ' <span class="suggestion-quantify">[Add specific metrics]</span>'
        
        # Highlight existing skills that match job requirements
        for skill in job_skills:
            if skill.lower() in original_line.lower():
                revised_line = re.sub(
                    rf'\b{re.escape(skill)}\b', 
                    f'<span class="skill-match">{skill}</span>', 
                    original_line, 
                    flags=re.IGNORECASE
                )
        
        revised_lines.append(revised_line)
    
    # Add summary of suggested improvements
    improvement_summary = []
    
    if missing_skills:
        improvement_summary.append(f"<strong>Add these skills:</strong> {', '.join(missing_skills)}")
    
    if len(found_verbs) < 5:
        improvement_summary.append("<strong>Use more action verbs:</strong> " + 
                                 ", ".join([v for v in suggested_verbs if v not in found_verbs][:5]))
    
    if not re.search(r'\d+', resume):
        improvement_summary.append("<strong>Add quantification:</strong> Include specific numbers and metrics")
    
    summary_html = ""
    if improvement_summary:
        summary_html = f"""
<div class="improvement-summary">
<h4>🎯 Key Improvements Suggested:</h4>
<ul>
{''.join([f'<li>{item}</li>' for item in improvement_summary])}
</ul>
</div>
"""
    
    return f"""
{summary_html}
<div class="resume-content">
{chr(10).join(revised_lines)}
</div>
"""

@router.post("/analyze-resume")
async def analyze_resume(
    request: Request,
    resume: str = Form(...),
    job_description: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    # Define common skills and keywords for analysis
    technical_skills = {
        'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'],
        'databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'dynamodb'],
        'frameworks': ['django', 'flask', 'fastapi', 'spring', 'react', 'angular', 'vue', 'node.js', 'express', 'laravel'],
        'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab'],
        'tools': ['git', 'github', 'jira', 'confluence', 'slack', 'figma', 'postman', 'swagger']
    }
    
    soft_skills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'organized', 'detail-oriented', 'time management', 'collaboration']
    
    # Convert to lowercase for comparison
    resume_lower = resume.lower()
    job_desc_lower = job_description.lower()
    
    # Extract skills from resume and job description
    resume_skills = set()
    job_skills = set()
    
    # Check for technical skills
    for category, skills in technical_skills.items():
        for skill in skills:
            if skill in resume_lower:
                resume_skills.add(skill)
            if skill in job_desc_lower:
                job_skills.add(skill)
    
    # Check for soft skills
    for skill in soft_skills:
        if skill in resume_lower:
            resume_skills.add(skill)
        if skill in job_desc_lower:
            job_skills.add(skill)
    
    # Find missing skills
    missing_skills = job_skills - resume_skills
    matching_skills = resume_skills & job_skills
    
    # Calculate match percentage
    match_percentage = len(matching_skills) / len(job_skills) * 100 if job_skills else 0
    
    # Generate suggestions
    suggestions = []
    
    if missing_skills:
        suggestions.append("🔍 **Missing Skills to Add:**")
        for skill in missing_skills:
            suggestions.append(f"   • Consider adding experience with {skill.title()}")
        suggestions.append("")
    
    if match_percentage < 50:
        suggestions.append("⚠️ **Low Skill Match Detected:**")
        suggestions.append("   • Your resume shows limited alignment with the job requirements")
        suggestions.append("   • Consider highlighting transferable skills and experiences")
        suggestions.append("")
    
    # Check for action verbs and quantify achievements
    action_verbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'built', 'optimized', 'increased', 'decreased', 'improved', 'delivered']
    found_verbs = [verb for verb in action_verbs if verb in resume_lower]
    
    if len(found_verbs) < 3:
        suggestions.append("📝 **Resume Writing Tips:**")
        suggestions.append("   • Use more action verbs to describe your achievements")
        suggestions.append("   • Quantify your accomplishments with specific numbers")
        suggestions.append("   • Focus on results rather than just responsibilities")
        suggestions.append("")
    
    # Check for metrics and numbers
    import re
    numbers = re.findall(r'\d+', resume)
    if len(numbers) < 2:
        suggestions.append("📊 **Quantify Your Achievements:**")
        suggestions.append("   • Add specific metrics (e.g., 'increased sales by 25%')")
        suggestions.append("   • Include project sizes, team sizes, or timeframes")
        suggestions.append("   • Mention any awards, certifications, or recognitions")
        suggestions.append("")
    
    # Check resume length
    if len(resume) < 1000:
        suggestions.append("📏 **Resume Length:**")
        suggestions.append("   • Your resume seems quite short")
        suggestions.append("   • Consider adding more details about your experiences")
        suggestions.append("   • Include relevant projects, certifications, or volunteer work")
        suggestions.append("")
    elif len(resume) > 3000:
        suggestions.append("📏 **Resume Length:**")
        suggestions.append("   • Your resume might be too long")
        suggestions.append("   • Focus on the most relevant experiences for this position")
        suggestions.append("   • Remove outdated or less relevant information")
        suggestions.append("")
    
    # Generate revised resume with suggestions
    revised_resume = generate_revised_resume(resume, job_skills, missing_skills, action_verbs, found_verbs)
    
    # Generate analysis result
    analysis_result = f"""
## 📋 Resume Analysis Results

### 📊 Match Summary
**Skill Match Percentage:** {match_percentage:.1f}%

### ✅ Skills You Have (Matching Job Requirements)
{', '.join(matching_skills) if matching_skills else 'None found'}

### 🎯 Skills Required by the Job
{', '.join(job_skills) if job_skills else 'No specific skills identified'}

### 📈 Resume Statistics
- **Resume Length:** {len(resume)} characters ({len(resume.split())} words)
- **Job Description Length:** {len(job_description)} characters ({len(job_description.split())} words)
- **Action Verbs Used:** {len(found_verbs)} out of 12 recommended
- **Quantified Achievements:** {'Yes' if len(numbers) >= 2 else 'No'}

### 💡 Suggestions for Improvement

{chr(10).join(suggestions) if suggestions else 'Great job! Your resume appears well-aligned with the job requirements.'}

### 🔍 Next Steps
1. Review the missing skills and consider how your experience relates to them
2. Add specific metrics and achievements to your resume
3. Use more action verbs to describe your responsibilities
4. Tailor your resume to highlight relevant experiences for this specific role

---

## 📝 Revised Resume with Suggestions

<div class="revised-resume">
{revised_resume}
</div>
"""
    
    return templates.TemplateResponse("user_dashboard.html", {
        "request": request, 
        "analysis_result": analysis_result
    })