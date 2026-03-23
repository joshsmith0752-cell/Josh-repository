import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { level, teamSize, teamName, sections, focus } = await req.json()

    const prompt = `You are an expert cheerleading coach and routine choreographer.

Create a detailed cheerleading routine plan for the following team:

- Team Name: ${teamName || 'The Team'}
- Competition Level: ${level}
- Team Size: ${teamSize} athletes
- Routine Sections to include: ${sections.join(', ')}
- Special Focus / Notes: ${focus || 'None'}

For each section provide:
1. Duration (in counts or seconds)
2. Specific skills appropriate for ${level}
3. Formation description
4. Key coaching notes
5. ICU rule considerations for this level

Also provide:
- Overall routine flow and pacing tips
- Music tempo recommendation (BPM range)
- Safety reminders specific to this level
- What judges will be scoring at ${level}

Format with clear section headers using **bold**. Be specific and practical — this is for real competition use.`

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
    })

    return NextResponse.json({ routine: text })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate routine' },
      { status: 500 }
    )
  }
}
